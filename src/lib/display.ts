import type { Ability, Row, Source } from './types'

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

export const ROW_LABEL: Record<Row, string> = {
  melee: 'Close combat',
  ranged: 'Ranged',
  siege: 'Siege',
}

/** Short rules summary per ability, in our own words. Sorted by label. */
export const ABILITY: Record<Ability, { label: string; text: string }> = {
  agile: { label: 'Agile', text: 'Can be placed in either the close combat or the ranged row.' },
  avenger: { label: 'Summon Avenger', text: 'When removed from the board, summons a stronger unit in its place.' },
  berserker: { label: 'Berserker', text: 'Transforms into a bear when Mardroeme is played on its row.' },
  decoy: { label: 'Decoy', text: 'Swap with a card on the board to return it to your hand.' },
  hero: { label: 'Hero', text: 'Not affected by special cards, weather or abilities.' },
  horn: { label: "Commander's Horn", text: 'Doubles the strength of all unit cards in a row (once per row).' },
  mardroeme: { label: 'Mardroeme', text: 'Triggers transformation of all Berserker cards in its row.' },
  medic: { label: 'Medic', text: 'Choose one unit from your discard pile and play it instantly (no heroes or specials).' },
  moraleBoost: { label: 'Morale Boost', text: 'Adds +1 to every unit in its row, except itself.' },
  muster: { label: 'Muster', text: 'Finds every card with the same name in your deck and plays them at once.' },
  scorch: { label: 'Scorch', text: "Destroys the strongest card(s) on the battlefield, or in the opponent's row for unit versions." },
  spy: { label: 'Spy', text: "Played on your opponent's side (counts toward their total), then you draw 2 cards." },
  tightBond: { label: 'Tight Bond', text: 'Placed next to a card with the same name, doubles the strength of both.' },
  weather: { label: 'Weather', text: 'Sets the strength of all non-hero units in the affected rows to 1, or clears weather.' },
}
