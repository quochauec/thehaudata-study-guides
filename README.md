# TheHauData Study Guides (GitHub Pages site)

Static site. No build step. Root = this folder.

| Path | Content |
|------|---------|
| `index.html` | Lesson list |
| `lessons/L03.html` | Lesson 3 study guide (self-contained; only Google Fonts loaded from CDN) |
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

Copy `lessons/L03.html` as the template, add a card in `index.html` (replace the "Coming soon" row).

Source of truth for L03: `../study-guide/L03_study-guide.html` (same content, artifact version).
