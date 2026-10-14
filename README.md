# The Shape of Threat — Vercel edition

This is the self-contained Next.js version of the English xT tactical clustering article prepared for the UIUC women's soccer coaching staff. It preserves the verified research narrative and notebook outputs while using the Next.js App Router for deployment on Vercel.

## Local development

```bash
npm install
npm run dev
```

## Editing the article

- Edit the article in `app/page.tsx`.
- Edit the visual design in `app/globals.css`.
- Keep research figures and supporting data in `public/assets/`.
- Run `npm run lint` and `npm run build` before deployment.

## Export movement probabilities

Run `python build_transition_matrix.py` with Python 3.10+ (no extra packages).
The optional research script reads the original saved match list and event files
from the parent workspace. It is not part of the website build. If the blog folder
is moved, use `--data-root`, `--metadata`, and `--reference` to locate those inputs.

The script writes these files beside itself:

- `transition_probability_matrix_192x192.csv`: exactly 192 numeric rows and
  columns, with no header or index. Row = origin, column = destination.
- `transition_counts_192x192.csv`: corresponding movement counts.
- `transition_matrix_report.json`: grid definitions, filters, input hashes,
  sample totals, and checks against the saved global xT model's counts.

Zone IDs use `y_bin * 16 + x_bin`, from 0 through 191. Probabilities are conditional
on a successful pass or carry, retaining same-zone movements and excluding the
five set-piece pass types from notebook 06. Populated rows sum to 1; origins with
no moves stay all-zero and are listed in the report. Count mismatches with the
reference stop matrix export so incompatible samples are not silently combined.
The script does not update the frontend, recompute clustering, or change saved xT.

## Interactive xT explanation

The article's "Valuing space" section contains an interactive pitch at
`/#threat-explorer`. The default view uses a high-contrast green scale for the
original research xT. Hover or tap to inspect a zone; the shared value map remains
fixed. Compare it with "Within 5 actions (illustration)" on the same absolute,
linear 0–0.30 scale. The five-action view does not replace the research values.
The pitch explicitly marks attacks left-to-right, own goal, and opponent goal.

"Move destinations" preserves the original hover/pin interaction. Its colors
show movement probabilities, including backward and same-zone moves, on a fixed
0–60% square-root scale. Click/tap to pin a start, then inspect destinations.
Unpin or press Escape to resume exploring. Arrow keys navigate the pitch.

Run `python prepare_interactive_data.py` to package the verified matrix and zone
CSV into `public/assets/xt-interactive.json` (schema version 2). It verifies input
hashes, computes five-action values starting from zero, and reproduces the saved
100-step research values within 1e-10. No raw events or clustering are rerun;
original research CSVs remain unchanged. The JSON ships with the website.

Both values use V[n+1] = shot_probability * goal_probability +
move_probability * T * V[n], with V[0] = 0. The original model excludes failed
moves, so its long horizon retains high defensive values. The defensive five
columns average 0.10939292 in the saved model versus 0.00028084 at five actions.
More iterations alone do not remove this effect. Including turnovers would
require changing and rerunning model estimation, then reassessing downstream
research. The saved model reached its 100-step cap before the notebook's 1e-6
convergence threshold (last change about 8.35e-5).

Direction audit: an evenly spaced sample of 50 matches from the saved match list
contained 1,279 shots, all in the right half (mean x=103.99 on a 120-unit pitch).
All 209 team/period groups had mean shot x above 60. This supports the existing
attacking-right convention; no coordinate reversal is applied. Grid y=0 stays at
the bottom to match notebook figures.

The sidebar shows the selected xT comparison and simplified xG (goals/shots).
Zones without shots display "No shot sample". The original static map remains
available below the interactive figure.

Browser verification: with a local server on port 3012, run
`node scripts/verify-interactive.cjs` using an installed Playwright package and
Microsoft Edge. `PLAYWRIGHT_MODULE` can point to a shared Playwright installation;
`TEST_URL` can override the server URL. Checks cover every matrix row, sidebar
values, hover, pinning, keyboard, touch, error recovery, and responsive layout.
