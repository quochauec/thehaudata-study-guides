# TheHauData Study Guides (GitHub Pages site)

Static site. No build step. Root = this folder.

| Path | Content |
|------|---------|
| `index.html` | Lesson list |
| `lessons/L02.html` … `L10.html` | Study guides. L03 is self-contained; the others share `assets/` |
| `assets/guide.css`, `assets/guide.js` | Shared styles and engine used by every lesson except L03 |
| `cases/index.html` | Case Study Practice Zone: 14 cases (ADW, CRM, GBE at junior level, plus 3 stretch), 3-step flow (context, approach, solve and conclude), hints and answers closed until opened. Single self-contained file built from `../case-studies-src`: `python -I challenges.py && python -I build_cases.py` (queries verified in DuckDB) |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |

## Publish

1. Create a GitHub repo, e.g. `thehaudata-study-guides` (public repo needed for free Pages; private needs a paid plan).
2. Upload the **contents** of this folder to the repo root (so `index.html` sits at the top).
3. Repo Settings → Pages → Source: *Deploy from a branch* → Branch `main`, folder `/ (root)` → Save.
4. After about a minute the site is at `https://<username>.github.io/<repo>/`.

## Before publishing

- Pages are **public to anyone with the link**. Homework solutions are visible. Do not add recruitment tests (third-party content) or student work.
- Pages carry `<meta name="robots" content="noindex">` to discourage search indexing. It is a request, not access control.

## Add a lesson

Lesson sources and the build script live outside this repo in `6. Workspace/websites/study-guide-src/` (one `L0N.py` / `L10.py` per lesson, plus `gen_res_L07_10.py` (DuckDB runs the queries and writes `res_L07_10.json`), `build.py` assembles the page into `lessons/`). Add a card in `index.html` for each new lesson.

Source of truth for L03: `../study-guide/L03_study-guide.html` (same content, artifact version).
