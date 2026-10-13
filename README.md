# Gwent Tracker

A simple web tool for Witcher 3 players: upload your save, see which Gwent
cards you're still missing and where to find them.

> ⚠️ **Not yet live.** Work in progress — see [Releases](https://github.com/vishalgupta-git/GwentTracker/releases) for build updates.

## Why this exists

The in-game "Collect 'Em All" achievement asks you to track down every
base-game Gwent card. The game doesn't tell you which ones you still need, where
they come from, or warn you about the ones you can permanently miss by
progressing the main story. This tool does.

## What it will do

1. You open the tool at [`vishalgupta-git.github.io/GwentTracker`](https://vishalgupta-git.github.io/GwentTracker/) in your browser.
2. You upload your Witcher 3 save file (`.sav` from `Documents/The Witcher 3/gamesaves/`).
3. The tool shows you:
   - **Missing cards** — what you still need, which deck they belong to, and where to find each one (buy from X, win from Y, quest reward from Z).
   - **Missable warnings** — cards you can lose for good if you push past a certain quest without them.
   - **Incomplete sets** — cards where you own some copies but need more.
4. A toggle at the top lets you widen the view to Hearts of Stone and Blood
   and Wine cards too.

Your save file is parsed on the server, used once, and deleted. Nothing is
stored.

## Status

- ✅ Research complete
- ✅ Architecture + hosting split locked in (GitHub Pages frontend + separate Proxmox-hosted API on `gwent-api.urvai.in`)
- ✅ Frontend stack locked in: Vite + Svelte 5 + TypeScript + Tailwind CSS + shadcn-svelte
- ✅ Repo scaffolding done (git, docs, license, `.gitignore`)
- ✅ Phase 1 build — JSON upload + diff + results UI (pending first deploy)
- ⏳ Phase 2 — direct `.sav` upload wired to the API
- ⏳ Phase 3 (optional) — parser in-browser (WASM), retire the API

Check the [Releases page](https://github.com/vishalgupta-git/GwentTracker/releases)
for shipped versions.

## Development

```bash
npm install
npm run dev      # http://localhost:5173/GwentTracker/
npm test         # diff tests against the a.txt fixture
npm run build    # outputs dist/
```

The card catalog (`src/lib/data/catalog.json`) is generated from the
YAML files in `data/` by `scripts/build-catalog.mjs`; it runs
automatically before `dev`, `build`, `test` and `check`.

## Credit

- Reference card data derived from [`rfvgyhn/gwent-tracker`](https://github.com/rfvgyhn/gwent-tracker) (MIT).
- The Witcher 3: Wild Hunt and Gwent are property of CD Projekt Red. This
  project is unaffiliated and non-commercial.

## License

[MIT](LICENSE)
