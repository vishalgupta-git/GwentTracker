export type Source = 'BaseGame' | 'HeartsOfStone' | 'BloodAndWine'
export type CardType = 'Special' | 'Hero' | 'Unit' | 'Leader'

export interface Location {
  type: string // "Buy from Trader", "Win from NPC", "Base Deck", ...
  npc?: string
  quest?: string
  area?: string
  territory?: string
  region?: string
}

/** One entry of the bundled catalog.json. `index` is the save's card id. */
export interface ReferenceCard {
  index: number
  name: string
  deck: string
  type: CardType
  maxCopies: number
  source: Source
  missable: boolean
  flavor?: string
  /** Summon cards are not stored in the save; they mirror this parent index. */
  attachedTo?: number
  locations: Location[]
}

export interface MissableGroup {
  cardIds: number[]
  questName: string
  region: string
  /** Quest after which the cards are lost. null = no hard cutoff. */
  cutoff: string | null
  details: string | null
  notes: string[]
}

export interface Catalog {
  cards: ReferenceCard[]
  missables: MissableGroup[]
}

/** Uploaded JSON (same shape as samples/sample-collection.json): `{"gwentCards": {"<index>": OwnedCard}}`. */
export interface OwnedCard {
  count: number
  name: string
}
export type SaveCards = Record<string, OwnedCard>

/** All catalog indices sharing a deck + name, shown as one row. */
export interface CardGroup {
  key: string
  name: string
  deck: string
  type: CardType
  source: Source
  missable: boolean
  flavor?: string
  cards: ReferenceCard[]
  have: number
  total: number
  /** The user marked this card complete by hand; `have` is forced to `total`. */
  marked: boolean
  locations: Location[]
}

export interface MissableStatus {
  group: MissableGroup
  missing: ReferenceCard[]
}

export interface DiffResult {
  groups: CardGroup[]
  missing: CardGroup[]
  incomplete: CardGroup[]
  /** Groups the user marked complete that the save alone wouldn't complete. */
  marked: CardGroup[]
  missables: MissableStatus[]
  unknownInSave: { index: number; raw: OwnedCard }[]
  totals: {
    namesOwned: number
    namesTotal: number
    copiesOwned: number
    copiesTotal: number
  }
}
