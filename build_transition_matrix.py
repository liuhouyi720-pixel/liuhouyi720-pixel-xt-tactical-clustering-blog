"""Export the global successful-movement transition matrix used by notebook 06.

Run with Python 3.10+ (standard library only):
    python build_transition_matrix.py

Defaults use the original research data in the parent workspace. If this blog
folder is moved, supply --data-root, --metadata and --reference explicitly.
No notebooks, frontend files, existing xT values, or clusters are modified.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import time
from datetime import datetime, timezone
from pathlib import Path

GRID_L, GRID_W = 16, 12
PITCH_LENGTH, PITCH_WIDTH = 120, 80
TOTAL_ZONES = GRID_L * GRID_W
SET_PIECE_PASS_TYPES = {"Corner", "Free Kick", "Goal Kick", "Kick Off", "Throw-in"}


def name_of(value):
    return value.get("name") if isinstance(value, dict) else None


def point_to_zone(location):
    """Match notebook 06 binning, including the far pitch boundaries."""
    if not isinstance(location, list) or len(location) < 2:
        return None
    x, y = location[:2]
    if x is None or y is None or not math.isfinite(x) or not math.isfinite(y):
        return None
    if not (0 <= x <= PITCH_LENGTH and 0 <= y <= PITCH_WIDTH):
        return None
    x_bin = min(int(x / PITCH_LENGTH * GRID_L), GRID_L - 1)
    y_bin = min(int(y / PITCH_WIDTH * GRID_W), GRID_W - 1)
    return y_bin * GRID_L + x_bin


def accumulate_events(events, counts, shots, goals, totals):
    for event in events:
        event_type = name_of(event.get("type"))
        if event_type not in {"Shot", "Pass", "Carry"}:
            continue
        start = point_to_zone(event.get("location"))
        if start is None:
            continue
        if event_type == "Shot":
            shots[start] += 1
            if name_of((event.get("shot") or {}).get("outcome")) == "Goal":
                goals[start] += 1
            continue
        if event_type == "Pass":
            movement = event.get("pass") or {}
            if name_of(movement.get("type")) in SET_PIECE_PASS_TYPES:
                continue
            # Any non-null pass outcome is unsuccessful in notebook 06.
            if movement.get("outcome") is not None:
                continue
        else:
            movement = event.get("carry") or {}
        end = point_to_zone(movement.get("end_location"))
        if end is None:
            continue
        # Same-zone moves are intentionally retained, including short carries.
        counts[start][end] += 1
        totals[event_type] += 1


def normalize(counts):
    # Empty origins remain all-zero and are identified in the report.
    return [[count / total for count in row] if (total := sum(row)) else
            [0.0] * TOTAL_ZONES for row in counts]


def read_rows(path):
    with path.open(encoding="utf-8-sig", newline="") as stream:
        return list(csv.DictReader(stream))


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_matrix(path, matrix):
    # No header or index: exactly 192 numeric rows by 192 numeric columns.
    with path.open("w", encoding="utf-8", newline="") as stream:
        csv.writer(stream).writerows(matrix)


def main():
    project = Path(__file__).resolve().parent
    workspace = project.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-root", type=Path, default=workspace / "archive/data")
    parser.add_argument("--metadata", type=Path,
                        default=workspace / "Main_projects/outputs/match_metadata.csv")
    parser.add_argument("--reference", type=Path,
                        default=workspace / "Main_projects/outputs/global_xt_zone_values.csv")
    parser.add_argument("--output-dir", type=Path, default=project)
    args = parser.parse_args()
    started = time.perf_counter()
    metadata = read_rows(args.metadata)
    if not metadata:
        raise ValueError("The saved match list is empty.")
    # Preserve original row multiplicity, exactly as notebook 06 iterates metadata.
    match_ids = [int(row["match_id"]) for row in metadata]
    event_paths = [args.data_root / "events" / f"{match_id}.json" for match_id in match_ids]
    missing = [str(path) for path in event_paths if not path.is_file()]
    if missing:
        raise FileNotFoundError(f"Missing {len(missing)} original event files; first: {missing[0]}")
    reference = {int(row["zone"]): row for row in read_rows(args.reference)}
    if set(reference) != set(range(TOTAL_ZONES)):
        raise ValueError("The reference must contain all 192 zone IDs exactly once.")
    counts = [[0] * TOTAL_ZONES for _ in range(TOTAL_ZONES)]
    shots, goals = [0] * TOTAL_ZONES, [0] * TOTAL_ZONES
    totals = {"Pass": 0, "Carry": 0}
    source_hashes = []
    print(f"Scanning {len(match_ids):,} saved match rows; grid {GRID_L} x {GRID_W}.", flush=True)
    for index, (match_id, path) in enumerate(zip(match_ids, event_paths), 1):
        content = path.read_bytes()
        events = json.loads(content)
        if not isinstance(events, list):
            raise ValueError(f"Expected an event list in {path}")
        try:
            accumulate_events(events, counts, shots, goals, totals)
        except (TypeError, ValueError, AttributeError) as exc:
            raise ValueError(f"Invalid event in match {match_id}: {exc}") from exc
        source_hashes.append({"match_id": match_id, "sha256": hashlib.sha256(content).hexdigest()})
        if index % 200 == 0 or index == len(match_ids):
            print(f"  {index:,}/{len(match_ids):,} matches; "
                  f"{sum(totals.values()):,} successful moves; "
                  f"{time.perf_counter() - started:.1f}s", flush=True)

    movement_counts = [sum(row) for row in counts]
    probabilities = normalize(counts)
    empty_zones = [zone for zone, count in enumerate(movement_counts) if count == 0]
    row_sum_error = max(abs(sum(row) - (1.0 if movement_counts[i] else 0.0))
                        for i, row in enumerate(probabilities))
    if row_sum_error > 1e-12 or any(not 0 <= p <= 1 for row in probabilities for p in row):
        raise ValueError("Probability normalization failed.")

    mismatches = []
    for zone in range(TOTAL_ZONES):
        if (int(reference[zone]["x_bin"]), int(reference[zone]["y_bin"])) != (zone % GRID_L, zone // GRID_L):
            raise ValueError(f"Reference grid indexing differs at zone {zone}.")
        for field, actual in (("successful_move_count", movement_counts[zone]),
                              ("shot_count", shots[zone]), ("goal_count", goals[zone])):
            expected = float(reference[zone][field])
            if actual != expected:
                mismatches.append({"zone": zone, "field": field,
                                   "reference": expected, "actual": actual})

    args.output_dir.mkdir(parents=True, exist_ok=True)
    report_path = args.output_dir / "transition_matrix_report.json"
    probability_path = args.output_dir / "transition_probability_matrix_192x192.csv"
    count_path = args.output_dir / "transition_counts_192x192.csv"
    report = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "source_notebook": "06_build_team_season_xt_matrices.ipynb",
        "shape": [TOTAL_ZONES, TOTAL_ZONES],
        "rows": "origin zone, 0 through 191",
        "columns": "destination zone, 0 through 191",
        "csv_header": False,
        "csv_index": False,
        "grid": {"length_bins": GRID_L, "width_bins": GRID_W,
                 "pitch_length": PITCH_LENGTH, "pitch_width": PITCH_WIDTH,
                 "zone_index": "y_bin * 16 + x_bin", "attack_direction": "right",
                 "existing_blog_image_origin": "lower"},
        "probability_definition": "P(destination | origin, successful pass or carry)",
        "excluded_pass_types": sorted(SET_PIECE_PASS_TYPES),
        "same_zone_moves_included": True,
        "shot_filter": "All valid-location Shot events, matching notebook 06",
        "metadata_path": str(args.metadata.resolve()),
        "metadata_sha256": sha256(args.metadata),
        "reference_path": str(args.reference.resolve()),
        "reference_sha256": sha256(args.reference),
        "data_root": str(args.data_root.resolve()),
        "match_rows": len(match_ids),
        "unique_matches": len(set(match_ids)),
        "successful_passes": totals["Pass"],
        "carries": totals["Carry"],
        "successful_moves": sum(movement_counts),
        "shots": sum(shots), "goals": sum(goals),
        "origin_move_counts": movement_counts,
        "zero_movement_zones": empty_zones,
        "max_probability_row_sum_error": row_sum_error,
        "reference_counts_match": not mismatches,
        "reference_count_mismatches": mismatches,
        "event_sources": source_hashes,
        "elapsed_seconds": round(time.perf_counter() - started, 3),
    }
    if not mismatches:
        write_matrix(probability_path, probabilities)
        write_matrix(count_path, counts)
        # Verify the actual saved CSV, not only the in-memory representation.
        with probability_path.open(encoding="utf-8", newline="") as stream:
            restored = [[float(value) for value in row] for row in csv.reader(stream)]
        if restored != probabilities:
            raise ValueError("Saved probability matrix failed round-trip verification.")
        report["outputs"] = {p.name: {"sha256": sha256(p), "bytes": p.stat().st_size}
                             for p in (probability_path, count_path)}
    report_path.write_text(json.dumps(report, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    if mismatches:
        raise ValueError(f"{len(mismatches)} reference count mismatches. Matrices were NOT written; "
                         f"see {report_path}. Check the original data before combining with saved xT.")
    print(f"Verified all 192 origins against saved movement, shot and goal counts.\n"
          f"Maximum row-sum error: {row_sum_error:.3g}\n"
          f"Saved {probability_path}\nSaved {count_path}\nSaved {report_path}", flush=True)


if __name__ == "__main__":
    main()
