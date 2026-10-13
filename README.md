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
4. Got a card the save doesn't show yet? **Mark it as complete** and it
   counts as collected (saved in your browser, undo any time).
5. A toggle at the top lets you widen the view to Hearts of Stone and Blood
   and Wine cards too.

Your save file is read **entirely in your browser**. It is never uploaded
anywhere, and there is no server.

## Status

- ✅ Card catalog, missing / incomplete / missable reports, DLC toggle
- ✅ Real Gwent card images, grid and list views
- ✅ Mark cards as complete (saved in your browser)
- ✅ Direct `.sav` upload, parsed in the browser (no server)
- ⏳ Public launch on GitHub Pages
- ⏳ Visual theme pass

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

- Save parsing is a minimal TypeScript port of [`rfvgyhn/W3SavegameEditor`](https://github.com/rfvgyhn/W3SavegameEditor) (MIT).
- Reference card data derived from [`rfvgyhn/gwent-tracker`](https://github.com/rfvgyhn/gwent-tracker) (MIT).
- Card images © CD Projekt Red; in-game card renders from the
  [Witcher Wiki](https://witcher.fandom.com/), resized and self-hosted
  (`data/card-faces.json` maps each card; `npm run card-art` re-fetches).
- The Witcher 3: Wild Hunt, Gwent and all card art are property of CD Projekt Red. This
  project is unaffiliated and non-commercial.

## License

[MIT](LICENSE)
