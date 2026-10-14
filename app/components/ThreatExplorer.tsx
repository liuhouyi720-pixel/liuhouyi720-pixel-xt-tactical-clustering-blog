"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import styles from "./ThreatExplorer.module.css";

type Zone = {
  id: number; x: number; y: number; xt: number; xtFiveActions: number;
  shotConversion: number | null; shots: number; goals: number; moves: number;
};
type ExplorerData = {
  version: number; matches: number; successfulMoves: number;
  zones: Zone[]; transitions: number[][];
};

const INITIAL_ZONE = 110;
// Display y=11 at the top, matching the original notebook's origin="lower".
const DISPLAY_ZONES = Array.from({ length: 192 }, (_, i) => (11 - Math.floor(i / 16)) * 16 + i % 16);
const formatNumber = new Intl.NumberFormat("en-US");
const percent = (n: number) => `${(100 * n).toFixed(2)}%`;
const zoneLabel = (id: number) => `(${id % 16}, ${Math.floor(id / 16)})`;

type View = "xt" | "moves";
type Horizon = "research" | "five";

function color(value: number, view: View) {
  // Both maps have fixed, labelled scales. xT uses absolute values, never
  // per-origin min/max normalization: the saved defensive values stay honest.
  const t = view === "xt" ? Math.min(1, Math.max(0, value) / 0.30)
    : Math.sqrt(Math.min(1, Math.max(0, value) / 0.60));
  const stops = [[250, 253, 247], [130, 210, 130], [25, 133, 61], [0, 53, 28]];
  const index = Math.min(2, Math.floor(t * 3));
  const f = t * 3 - index;
  return `rgb(${stops[index].map((v, i) => Math.round(v + (stops[index + 1][i] - v) * f)).join(",")})`;
}
const legend = (view: View) => `linear-gradient(to right, ${Array.from({ length: 21 }, (_, i) => `${color(i / 20 * (view === "xt" ? 0.3 : 0.6), view)} ${i * 5}%`).join(",")})`;

function isExplorerData(value: unknown): value is ExplorerData {
  if (!value || typeof value !== "object") return false;
  const data = value as ExplorerData;
  return data.version === 2 && Array.isArray(data.zones) && data.zones.length === 192 &&
    data.zones.every((z, i) => z.id === i && Number.isFinite(z.xt) && Number.isFinite(z.xtFiveActions) &&
      Number.isFinite(z.moves) && (z.shotConversion === null || Number.isFinite(z.shotConversion))) &&
    Array.isArray(data.transitions) && data.transitions.length === 192 &&
    data.transitions.every(row => Array.isArray(row) && row.length === 192 &&
      row.every(p => Number.isFinite(p) && p >= 0 && p <= 1) &&
      Math.abs(row.reduce((a, b) => a + b, 0) - 1) < 1e-6);
}

export default function ThreatExplorer() {
  const [data, setData] = useState<ExplorerData | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [origin, setOrigin] = useState(INITIAL_ZONE);
  const [destination, setDestination] = useState<number | null>(null);
  const [view, setView] = useState<View>("xt");
  const [horizon, setHorizon] = useState<Horizon>("research");
  const [pinned, setPinned] = useState(false);
  const [focusZone, setFocusZone] = useState(INITIAL_ZONE);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/assets/xt-interactive.json", { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error("Could not load the movement data.");
        return response.json();
      })
      .then((value: unknown) => {
        if (!isExplorerData(value)) throw new Error("Invalid movement data.");
        setData(value);
      })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt]);

  function explore(id: number) {
    if (view === "moves" && pinned) setDestination(id);
    else { setOrigin(id); setDestination(null); }
  }

  function keyDown(event: KeyboardEvent<HTMLButtonElement>, id: number) {
    const x = id % 16, y = Math.floor(id / 16);
    let next = id;
    if (event.key === "ArrowRight") next = y * 16 + Math.min(15, x + 1);
    else if (event.key === "ArrowLeft") next = y * 16 + Math.max(0, x - 1);
    else if (event.key === "ArrowUp") next = Math.min(11, y + 1) * 16 + x;
    else if (event.key === "ArrowDown") next = Math.max(0, y - 1) * 16 + x;
    else if (event.key === "Escape") { setPinned(false); setDestination(null); return; }
    else return;
    event.preventDefault();
    setFocusZone(next);
    buttons.current[next]?.focus();
  }

  const zoneValue = (z: Zone) => horizon === "five" ? z.xtFiveActions : z.xt;
  const zone = data?.zones[origin];
  const row = data?.transitions[origin];
  const top = row ? row.map((p, id) => ({ p, id })).sort((a, b) => b.p - a.p).slice(0, 3) : [];

  return (
    <figure className={styles.explorer} id="threat-explorer" aria-labelledby="explorer-title">
      <div className={styles.heading}>
        <span>EXPLORE THE MODEL</span>
        <h3 id="explorer-title">How threatening is this part of the pitch?</h3>
        <p>{view === "xt"
          ? "Darker green means higher xT. Explore a zone, then compare its longer-term value with the threat within five actions. All attacks run from left to right."
          : "Darker green means a more frequent destination for a successful pass or carry. Hover to choose a starting zone; pin it to inspect destinations. All attacks run from left to right."}</p>
      </div>
      {!data ? (
        <div className={styles.loading} role="status">
          {error ? <><p>The movement map could not load.</p><button type="button" onClick={() => { setError(false); setAttempt(n => n + 1); }}>Try again</button></> : "Loading the movement map…"}
          <noscript>Enable JavaScript to explore the zones. The original xT figure is available below.</noscript>
        </div>
      ) : zone && row ? (
        <>
          <div className={styles.viewSwitch} role="group" aria-label="Map view">
            <button type="button" aria-pressed={view === "xt"} onClick={() => { setView("xt"); setPinned(false); setDestination(null); }}>xT values</button>
            <button type="button" aria-pressed={view === "moves"} onClick={() => { setView("moves"); setPinned(false); setDestination(null); }}>Move destinations</button>
          </div>
          <div className={styles.controls}>
            <label>xT comparison <select aria-label="xT comparison" value={horizon} onChange={event => setHorizon(event.target.value as Horizon)}>
              <option value="research">Research xT (original)</option>
              <option value="five">Within 5 actions (illustration)</option>
            </select></label>
            <label>{view === "xt" ? "Selected zone" : "Starting zone"} <select aria-label="Starting zone" value={origin} onChange={event => {
              const id = Number(event.target.value);
              setOrigin(id); setFocusZone(id); setDestination(null); setPinned(view === "moves");
            }}>{data.zones.map(z => <option key={z.id} value={z.id}>Zone {zoneLabel(z.id)}</option>)}</select></label>
            {view === "moves" && <button type="button" className={styles.pinButton} aria-pressed={pinned} onClick={() => { setPinned(!pinned); setDestination(null); }}>
              {pinned ? "Unpin start" : "Pin start"}
            </button>}
          </div>
          <p className={styles.help} id="pitch-help">{view === "xt" ? "Hover or tap a zone to read its value · use arrow keys when the pitch is focused. The shared xT map stays fixed as you explore." : pinned
            ? "Start pinned. Hover or tap a destination to read its probability. Unpin to choose a new start."
            : "Move to explore · click or tap to pin a start · use arrow keys when the pitch is focused."}</p>
          <div className={styles.layout}>
            <div className={styles.mapColumn}>
              <div className={styles.mapHeading}><span>{view === "moves" ? "DESTINATION PROBABILITY" : horizon === "five" ? "xT · WITHIN 5 ACTIONS" : "xT · ORIGINAL RESEARCH MODEL"}</span><span>16 × 12 zones</span></div>
              <div className={styles.pitch} role="group" aria-label="Interactive pitch: 16 columns and 12 rows" aria-describedby="pitch-help">
                <div className={styles.cells}>
                  {DISPLAY_ZONES.map(id => (
                    <button key={id} ref={node => { buttons.current[id] = node; }} type="button"
                      data-zone={id} data-xt={zoneValue(data.zones[id])} data-probability={row[id]} data-origin={id === origin}
                      className={`${styles.cell} ${id === origin ? styles.origin : ""} ${pinned && id === destination ? styles.destination : ""}`}
                      style={{ backgroundColor: color(view === "xt" ? zoneValue(data.zones[id]) : row[id], view) }}
                      tabIndex={id === focusZone ? 0 : -1}
                      aria-label={view === "xt" ? `Zone ${zoneLabel(id)}: xT ${zoneValue(data.zones[id]).toFixed(4)}` : pinned ? `Destination ${zoneLabel(id)}: ${percent(row[id])} from ${zoneLabel(origin)}` : `Start from zone ${zoneLabel(id)}`}
                      title={view === "xt" ? `Zone ${zoneLabel(id)} · xT ${zoneValue(data.zones[id]).toFixed(4)}` : `Zone ${zoneLabel(id)} · ${percent(row[id])} from ${zoneLabel(origin)}`}
                      onPointerEnter={event => { if (event.pointerType !== "touch") explore(id); }}
                      onFocus={() => { setFocusZone(id); explore(id); }}
                      onClick={() => { if (view === "moves" && pinned) setDestination(id); else { setOrigin(id); setDestination(null); setPinned(view === "moves"); } }}
                      onKeyDown={event => keyDown(event, id)}
                    />
                  ))}
                </div>
                <svg className={styles.markings} viewBox="0 0 120 80" aria-hidden="true">
                  <g fill="none" stroke="#789488" strokeWidth="0.35">
                    <rect x="0.25" y="0.25" width="119.5" height="79.5" />
                    <path d="M60 0V80 M0 18H18V62H0 M120 18H102V62H120 M0 30H6V50H0 M120 30H114V50H120" />
                    <circle cx="60" cy="40" r="9.15" />
                    <path d="M18 32.4A9.15 9.15 0 0 1 18 47.6 M102 32.4A9.15 9.15 0 0 0 102 47.6" />
                  </g>
                  <g fill="#789488"><circle cx="60" cy="40" r="0.55" /><circle cx="12" cy="40" r="0.5" /><circle cx="108" cy="40" r="0.5" /></g>
                  <g className={styles.direction}>
                    <rect x="35" y="2.2" width="50" height="9" rx="1.8" fill="#fff" fillOpacity="0.92" />
                    <text x="60" y="6.2" textAnchor="middle" fill="#064324" fontSize="2.8" fontWeight="700">ATTACKING DIRECTION</text>
                    <path d="M43 8.5H77 M74 7L77 8.5L74 10" fill="none" stroke="#064324" strokeWidth="0.7" />
                    <rect x="1" y="73.4" width="23" height="5.3" rx="1" fill="#fff" fillOpacity="0.92" />
                    <rect x="89" y="73.4" width="30" height="5.3" rx="1" fill="#fff" fillOpacity="0.92" />
                    <text x="12.5" y="77" textAnchor="middle" fill="#064324" fontSize="2.7" fontWeight="700">OWN GOAL</text>
                    <text x="104" y="77" textAnchor="middle" fill="#064324" fontSize="2.7" fontWeight="700">OPPONENT GOAL</text>
                  </g>
                  <circle cx={(origin % 16 + 0.5) * 7.5} cy={(11 - Math.floor(origin / 16) + 0.5) * 80 / 12} r="1.1" fill="#fff" stroke="#b44b25" strokeWidth="0.5" />
                </svg>
              </div>
              <div className={styles.legend}><span>{view === "xt" ? "0.00" : "0%"}</span><div style={{ background: legend(view) }} /><span>{view === "xt" ? "0.30 xT" : "60%"}</span></div>
              <p className={styles.scaleNote}>{view === "xt" ? "Fixed linear xT scale, shared by both comparisons. Orange outline = selected zone." : "Fixed probability scale; extra contrast for small probabilities. Orange outline = starting zone."}</p>
              <div className={styles.readout} role="status" aria-live="polite" aria-atomic="true">
                {view === "xt" ? <><span>Zone {zoneLabel(origin)} · {horizon === "five" ? "within 5 actions" : "research xT"}</span><strong>{zoneValue(zone).toFixed(4)} xT</strong></>
                  : pinned && destination !== null ? <><span>From {zoneLabel(origin)} to {zoneLabel(destination)}</span><strong>{percent(row[destination])}</strong></>
                  : <><span>Moves ending in their starting zone</span><strong>{percent(row[origin])}</strong></>}
              </div>
              <p className={styles.scaleNote}>{view === "moves" ? "Successful passes and carries can go backward or stay in the same zone. These colors show where the ball moves, not how threatening the destination is. The map totals 100%."
                : horizon === "five" ? "Five-action illustration: a shot or successful move counts as one action. This shorter horizon highlights immediate attacking areas; it does not replace the research model."
                : "Why is the defensive half still green? The research model accumulates threat over many moves and excludes failed moves. A deep starting point can therefore retain substantial long-term value."}</p>
            </div>
            <aside className={styles.sidebar} aria-label="Selected starting zone statistics">
              <p className={styles.originLabel}>{view === "xt" ? "SELECTED ZONE" : "STARTING ZONE"} <strong data-testid="origin-label">{zoneLabel(origin)}</strong></p>
              <dl className={styles.metrics}>
                <div><dt>Expected threat <span>xT</span></dt><dd data-testid="xt-value">{zoneValue(zone).toFixed(4)}</dd><dd className={styles.metricNote}>{horizon === "five" ? "Value within five actions, using the same movement and shooting data." : "Original location value used in the tactical research."}</dd></div>
                <div><dt>Simplified xG</dt><dd data-testid="xg-value" className={zone.shotConversion === null ? styles.noSample : ""}>{zone.shotConversion === null ? "No shot sample" : percent(zone.shotConversion)}</dd><dd className={styles.metricNote}>Goals ÷ shots from this zone. A location-only shooting estimate.</dd></div>
              </dl>
              <div className={styles.samples}><span>Successful moves <b>{formatNumber.format(zone.moves)}</b></span><span>Shots / goals <b>{formatNumber.format(zone.shots)} / {formatNumber.format(zone.goals)}</b></span></div>
              {view === "moves" && <><h4>Most frequent destinations</h4>
              <ol className={styles.destinations}>{top.map(({ p, id }) => <li key={id}><span>{zoneLabel(id)}{id === origin ? " · same zone" : ""}</span><strong>{percent(p)}</strong></li>)}</ol></>}
            </aside>
          </div>
          <figcaption className={styles.caption}>
            {formatNumber.format(data.matches)} matches · {formatNumber.format(data.successfulMoves)} successful passes and carries. Both xT comparisons use the same movement and shooting data; neither includes loss of possession from failed moves. Research xT is preserved unchanged. The move-destination view is conditional on a successful pass or carry. Specified set-piece passes are excluded. All attacks point right; zone coordinates are zero-based and the vertical orientation matches the notebook figures.
          </figcaption>
        </>
      ) : null}
    </figure>
  );
}
