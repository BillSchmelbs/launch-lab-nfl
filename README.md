# Launch Lab NFL — Phase 9 GitHub Pages

Static, mobile-first Launch Lab frontend. The browser receives **sanitized finished outputs only**. Exact Opportunity, Quality, and Game Environment component values, internal model formulas, and weights are intentionally not included in public JSON.

## Preview
Open `index.html` through a local HTTP server (JSON loading will not work reliably with a `file://` URL).

## GitHub Pages
1. Create a dedicated repository (recommended name: `launch-lab-nfl`).
2. Upload the contents of this folder to the repository root.
3. Settings → Pages → Deploy from a branch → `main` → `/(root)`.
4. Keep Pages unpublished until you are ready to share.

## Data flow
Colab computes Launch Lab privately → Phase 9 export creates sanitized JSON → sanitized JSON is pushed into `/data` → site renders it.

## Privacy
Do not upload private engine `.py` files, raw NFL model datasets, Phase 2–8 formulas, or notebooks to the public Pages repository. Only upload this site plus sanitized site-data JSON.
