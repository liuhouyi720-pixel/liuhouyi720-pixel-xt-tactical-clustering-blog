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
