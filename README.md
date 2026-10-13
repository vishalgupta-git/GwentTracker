# Gwent Tracker

Find every Witcher 3 Gwent card you're still missing. Drop in your save
file and see what you need, where to win or buy it, and which cards you're
about to lose for good.

### ▶ [Open the tracker](https://vishalgupta-git.github.io/GwentTracker/)

Free, no sign-up, and your save never leaves your browser.

## Why this exists

The in-game "Collect 'Em All" achievement asks you to track down every
base-game Gwent card. The game doesn't tell you which ones you still need,
where they come from, or warn you about the ones you can permanently miss by
progressing the story. This tool does.

## Features

- **Reads your save directly.** Pick any `.sav` from
  `Documents\The Witcher 3\gamesaves`. It's parsed **in your browser**;
  nothing is uploaded and there is no server.
- **Missing and incomplete cards**, grouped by faction, shown as the real
  in-game cards. Switch between a card grid and a compact list.
- **All cards view** — the whole collection, with cards you don't own faded.
- **Where to find each card** — the merchant, player or quest, with region.
- **Filter by region and source** — e.g. only cards you can *win* in
  *Novigrad*, to plan your next trip.
- **Missable warnings** — cards you lose for good after a certain quest, with
  the cutoff and tips.
- **Progress at a glance** — unique cards, total copies, and per-faction bars.
- **Mark as complete** — got a card since your last save? Tick it off; it
  counts as collected (saved in your browser, undo any time).
- **Copy or download a checklist** of any list as plain text.
- **Separate Hearts of Stone and Blood and Wine toggles.**
- **Remembers your last save** in this browser, so you can come back to it.
- **Installable** as an app and works offline after the first visit.
- **Light and dark themes**, works on phones.

No PC save handy? Hit **Try a sample** to see it in action.

## Development

```bash
npm install
npm run dev      # http://localhost:5173/GwentTracker/
npm test         # diff + save parser tests
npm run check    # type-check
npm run build    # outputs dist/
```

Optional: `GWENT_SAVE=/path/to/file.sav npm test` also runs the parser
against a real save. Never commit `.sav` files (they're gitignored).

### Project layout

```
src/
  App.svelte, app.css          page layout and theme tokens
  lib/save/                    .sav reader (LZ4 + variable table) in a Web Worker
  lib/collection/              catalog, diff, filters, checklist export,
                               "mark as complete" + last-save storage
  lib/components/              UI components (ui/ = shadcn-svelte sources)
data/catalog/                  card YAMLs vendored from rfvgyhn/gwent-tracker
data/card-faces.json           card index → card image source
public/cards/                  card images (WebP)
samples/sample-collection.json data for "Try a sample" and the tests
scripts/                       catalog build, card image fetch
```

The card catalog (`src/lib/data/catalog.json`) is generated from
`data/catalog/` by `scripts/build-catalog.mjs`; it runs automatically before
`dev`, `build`, `test` and `check`.

## Credit

- Save parsing is a minimal TypeScript port of [`rfvgyhn/W3SavegameEditor`](https://github.com/rfvgyhn/W3SavegameEditor) (MIT).
- Reference card data derived from [`rfvgyhn/gwent-tracker`](https://github.com/rfvgyhn/gwent-tracker) (MIT).
- Card images © CD Projekt Red; in-game card renders from the
  [Witcher Wiki](https://witcher.fandom.com/), resized and self-hosted
  (`npm run card-art` re-fetches).
- The Witcher 3: Wild Hunt, Gwent and all card art are property of CD Projekt
  Red. This project is unaffiliated and non-commercial.

## License

[MIT](LICENSE)
