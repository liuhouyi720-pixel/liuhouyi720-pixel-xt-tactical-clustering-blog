"""Package verified transition CSVs and saved zone values for the browser.

Run after build_transition_matrix.py. Preserve saved research xT and derive a
five-action illustration from the same counts, without rescanning events.
"""
import argparse
import csv
import hashlib
import json
import math
from pathlib import Path


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    root = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reference', type=Path,
                        default=root.parent / 'Main_projects/outputs/global_xt_zone_values.csv')
    args = parser.parse_args()
    report = json.loads((root / 'transition_matrix_report.json').read_text())
    if not report['reference_counts_match'] or digest(args.reference) != report['reference_sha256']:
        raise ValueError('Reference data does not match the verified transition export.')
    filename = 'transition_probability_matrix_192x192.csv'
    path = root / filename
    if digest(path) != report['outputs'][filename]['sha256']:
        raise ValueError('Transition matrix has changed since verification.')
    with path.open(newline='') as stream:
        matrix = [[float(v) for v in row] for row in csv.reader(stream)]
    if len(matrix) != 192 or any(len(row) != 192 for row in matrix):
        raise ValueError('Expected a 192 by 192 matrix.')
    for row in matrix:
        if any(not math.isfinite(v) or not 0 <= v <= 1 for v in row):
            raise ValueError('Invalid probability.')
        if not math.isclose(sum(row), 1, abs_tol=1e-12):
            raise ValueError('Expected populated origins with probabilities summing to one.')
    with args.reference.open(newline='', encoding='utf-8-sig') as stream:
        rows = sorted(csv.DictReader(stream), key=lambda r: int(r['zone']))
    zones = []
    for i, row in enumerate(rows):
        if int(row['zone']) != i or int(float(row['successful_move_count'])) != report['origin_move_counts'][i]:
            raise ValueError('Zone indexing or movement sample differs.')
        shots = int(float(row['shot_count']))
        zones.append({
            'id': i, 'x': int(row['x_bin']), 'y': int(row['y_bin']),
            'xt': float(row['xT']),
            'shotConversion': float(row['goal_prob']) if shots else None,
            'shots': shots, 'goals': int(float(row['goal_count'])),
            'moves': int(float(row['successful_move_count'])),
        })
    if len(zones) != 192:
        raise ValueError('Expected 192 zone records.')
    # V_0 = 0; each step permits one more shot or successful move. Loss of
    # possession is absent in the original model, so retain that assumption.
    immediate = [float(r['shot_prob']) * float(r['goal_prob']) for r in rows]
    move = [float(r['move_prob']) for r in rows]
    values = [0.0] * 192
    for step in range(1, 101):
        values = [immediate[i] + move[i] * sum(p * v for p, v in zip(matrix[i], values))
                  for i in range(192)]
        if step == 5:
            for zone, value in zip(zones, values):
                zone['xtFiveActions'] = value
    difference = max(abs(v - z['xt']) for v, z in zip(values, zones))
    if difference > 1e-10:
        raise ValueError('Saved xT is not reproduced by the original 100-step model.')
    defensive = [z for z in zones if z['x'] < 5]
    print(f"Original xT reproduced; max difference {difference:.3g}.")
    print('Defensive five-column means: research xT '
          f"{sum(z['xt'] for z in defensive)/len(defensive):.8f}; five-action xT "
          f"{sum(z['xtFiveActions'] for z in defensive)/len(defensive):.8f}.")
    payload = {
        'version': 2, 'grid': {'columns': 16, 'rows': 12, 'origin': 'lower', 'attackDirection': 'right'},
        'matches': report['unique_matches'], 'successfulMoves': report['successful_moves'],
        'zones': zones,
        'transitions': [[round(v, 10) for v in row] for row in matrix],
    }
    output = root / 'public/assets/xt-interactive.json'
    output.write_text(json.dumps(payload, separators=(',', ':'), allow_nan=False) + '\n', encoding='utf-8')
    print(f'Saved {output} ({output.stat().st_size:,} bytes). Verified reference and matrix hashes.')


if __name__ == '__main__':
    main()
