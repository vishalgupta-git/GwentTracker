# Gwent Tracker

A simple web tool for Witcher 3 players: upload your save, see which Gwent
cards you're still missing and where to find them.

> ⚠️ **Not yet live.** Work in progress — see [Releases](https://github.com/vishalgupta-git/GwentTracker/releases) for build updates.

## Why this exists

The in-game "Collect 'Em All" quest asks you to track down 120 unique
Gwent cards. The game doesn't tell you which ones you still need, where
they come from, or warn you about the ones you can permanently miss by
progressing the main story. This tool does.

## What it will do

1. You open [gwent.urvai.in](https://gwent.urvai.in) in your browser.
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

- ✅ Research and planning
- ⏳ **Phase 1 — Frontend (JSON upload):** in progress
- ⏳ Phase 2 — API for direct `.sav` upload
- ⏳ Phase 3 (optional) — parser in-browser, no server at all

Check the [Releases page](https://github.com/vishalgupta-git/GwentTracker/releases)
for shipped versions.

## Credit

- Reference card data derived from [`rfvgyhn/gwent-tracker`](https://github.com/rfvgyhn/gwent-tracker) (MIT).
- The Witcher 3: Wild Hunt and Gwent are property of CD Projekt Red. This
  project is unaffiliated and non-commercial.

## License

[MIT](LICENSE)
