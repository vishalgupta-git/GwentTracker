import type { Source } from './types'

export const SOURCE_LABEL: Record<Source, string> = {
  BaseGame: 'Base game',
  HeartsOfStone: 'Hearts of Stone',
  BloodAndWine: 'Blood and Wine',
}

// Faction accent, used as a small colored dot next to the deck name.
const DECK_COLOR: Record<string, string> = {
  Neutral: 'bg-stone-400',
  'Northern Realms': 'bg-sky-500',
  Nilfgaard: 'bg-yellow-500',
  Monsters: 'bg-red-600',
  "Scoia'tael": 'bg-emerald-500',
  Skellige: 'bg-violet-500',
}

export const deckColor = (deck: string) => DECK_COLOR[deck] ?? 'bg-muted-foreground'

export const DECK_ORDER = Object.keys(DECK_COLOR)

/** Self-hosted art fetched by scripts/fetch-card-art.mjs. */
export const cardArt = (index: number) => `${import.meta.env.BASE_URL}cards/${index}.webp`
