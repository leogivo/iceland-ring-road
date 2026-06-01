# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static, offline-capable PWA showing a 9-day Iceland Ring Road itinerary (June 2026). Vanilla HTML/CSS/JS — no framework, no build step, no dependencies. UI copy is in Italian.

## Run locally

Service workers don't work over `file://` — serve over HTTP:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

No build, lint, or test setup exists.

## Architecture

Data-driven rendering. The DOM is empty markup; everything visible is built at runtime from JSON.

- `index.html` — static shell with empty container elements (`#days`, `#tripSummary`, `#dayNav`, `#campsitesSection`). No content lives here.
- `itinerary.json` — single source of truth for all trip content. Edit this to change the site; never hardcode itinerary data in JS/HTML. Shape: `meta`, `days[]`, `campsites[]`.
- `app.js` — IIFE that `fetch`es `itinerary.json` and renders each section into its container. SVG icons inline in the `ICONS` map. `el(tag, attrs, children)` is the DOM-builder helper used everywhere (`html` attr key sets innerHTML, `on*` keys bind listeners). Day-chip nav highlights the current day via `IntersectionObserver` (`setupDayObserver`).
- `service-worker.js` — cache-first for the app shell (`PRECACHE_URLS`), network-first for `itinerary.json` so content updates appear when online but still work offline.
- `styles.css` — Nordic-minimal, mobile-first.

## Editing content

All in `itinerary.json`. A day has `id`, `date`, `title`, `summary` (`walk`/`drive`), `stops[]`. Stop `type`: `walk | drive | camp | midnight` (anything else falls back to the pin icon, see `iconFor`). Optional stop flags: `warning: true` (amber), `highlight: true` (green star), `mapsQuery` (generates an "Open in Maps" link). `meta.totalKmWalk`/`totalKmDrive` feed the summary tiles; the "9 Giorni" tile is hardcoded in `renderSummary`.

## Cache busting

After editing `index.html`, `styles.css`, or `app.js`, bump `VERSION` in `service-worker.js` (e.g. `iceland-v1` → `iceland-v2`) or the old shell stays cached on returning visitors. Editing only `itinerary.json` needs no bump (network-first).

## Deploy

GitHub Pages from `main` branch root. Repo not yet git-initialized.
