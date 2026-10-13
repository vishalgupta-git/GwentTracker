# Gwent Tracker

A web tool that reads a Witcher 3 Gwent card collection and tells you which
cards you're still missing — with where-to-find hints and warnings for cards
that can be permanently lost.

> **Status:** planning complete, build not started. See [`PLAN.md`](PLAN.md).

A desktop C# version exists ([`rfvgyhn/gwent-tracker`][upstream]), but there is
no hosted web version. This project fills that gap.

## What it does

- You hand it your Witcher 3 save (`.sav`) or a converted `gwentCards.json`.
- It compares what you own against the full card catalog.
- It shows you **missing cards**, **incomplete sets** (own some, need more),
  and **where to find each one**, with a badge on cards you can permanently
  miss by progressing the main story.
- Defaults to the base-game "Collect 'Em All" scope (120 unique names from
  199 cards); a toggle widens the view to include Hearts of Stone and Blood
  and Wine.

## Architecture (planned)

```
GitHub Pages (static)                     Proxmox VM behind Cloudflare Tunnel
┌─────────────────────┐  POST .sav   ┌────────────────────────────────────┐
│  gwent.urvai.in     │─────────────▶│  gwent-api.urvai.in                │
│  (HTML / JS / CSS)  │              │  POST /parse                       │
│  catalog + diff +   │◀─────────────│  wraps W3SavegameEditor (C#)       │
│  results tables     │  JSON reply  │  returns {"gwentCards": {...}}     │
└─────────────────────┘              └────────────────────────────────────┘
```

The frontend is a plain static site hosted on GitHub Pages. The parsing API
runs in a Docker container on a Proxmox VM, exposed to the public internet
through a Cloudflare Tunnel (no port forwarding). Your save file is parsed
in a temporary file and deleted immediately after the response is sent — it
is never persisted.

Full architecture, phases, and open decisions in [`PLAN.md`](PLAN.md).

## Repository layout (so far)

```
GwentTracker/
├── a.txt            # sample gwentCards JSON (used as a test fixture)
├── test.ipynb       # throwaway notebook — not production code
├── CLAUDE.md        # project context for Claude Code sessions
├── PLAN.md          # architecture + phased build plan
├── LICENSE          # MIT
└── README.md        # this file
```

Source directories will be added as the build phases land.

## Build phases

- **Phase 1 — Static frontend.** Upload a `gwentCards.json`, see missing
  cards in the browser. Deploys to `gwent.urvai.in` via GitHub Pages.
- **Phase 2 — Parser API.** Add `/parse` endpoint on the Proxmox VM; frontend
  accepts `.sav` directly. Deploys to `gwent-api.urvai.in` via Cloudflare
  Tunnel.
- **Phase 3 (optional).** Port the parser to TypeScript/WASM, retire the
  server, go fully static.

## Attribution

The reference card catalog (`data/*.yml`) and the save-file parser used in
Phase 2 are both derived from [`rfvgyhn/gwent-tracker`][upstream] and its
submodule `W3SavegameEditor`, both MIT-licensed. Their LICENSE notice is
preserved under `data/` once those files are vendored.

The Witcher 3: Wild Hunt and Gwent are property of CD Projekt Red. This
project is unaffiliated and non-commercial.

## License

[MIT](LICENSE)

[upstream]: https://github.com/rfvgyhn/gwent-tracker
