export type Source = 'BaseGame' | 'HeartsOfStone' | 'BloodAndWine'
export type CardType = 'Special' | 'Hero' | 'Unit' | 'Leader'

export interface Location {
  type: string // "Buy from Trader", "Win from NPC", "Base Deck", ...
  npc?: string
  quest?: string
  area?: string
  territory?: string
  region?: string
  /** Extra detail, e.g. how a random reward works. */
  note?: string
}

export type Row = 'melee' | 'ranged' | 'siege'
export type Ability =
  | 'agile'
  | 'avenger'
  | 'berserker'
  | 'decoy'
  | 'hero'
  | 'horn'
  | 'mardroeme'
  | 'medic'
  | 'moraleBoost'
  | 'muster'
  | 'scorch'
  | 'spy'
  | 'tightBond'
  | 'weather'

export type LeaderAbility =
  | 'agileReposition'
  | 'clearWeather'
  | 'counterLeader'
  | 'discard2Pick1'
  | 'doubleSpy'
  | 'extraCard'
  | 'halfWeather'
  | 'meleeHorn'
  | 'meleeScorch'
  | 'pickFog'
  | 'pickFrost'
  | 'pickRain'
  | 'pickWeather'
  | 'randomRestore'
  | 'rangedHorn'
  | 'rangedScorch'
  | 'reshuffleDiscards'
  | 'restoreToHand'
  | 'siegeHorn'
  | 'siegeScorch'
  | 'takeFromEnemyDiscard'
  | 'view3'

/** One entry of the bundled catalog.json. `index` is the save's card id. */
export interface ReferenceCard {
  index: number
  name: string
  deck: string
  type: CardType
  maxCopies: number
  source: Source
  missable: boolean
  /** Counts toward the "Collect 'Em All" achievement. */
  achievement: boolean
  /** Unit strength; absent for specials and leaders. */
  strength?: number
  /** Rows a unit can be played in, or rows a weather card hits. */
  rows: Row[]
  abilities: Ability[]
  /** Leaders only: their once-per-game ability. */
  leaderAbility?: LeaderAbility
  flavor?: string
  /** Summon cards are not stored in the save; they mirror this parent index. */
  attachedTo?: number
  /** Extra save indices holding further copies of this card (the game stores some copies as crinfrid2, crinfrid3, ...). */
  aliases?: number[]
  locations: Location[]
}

/** Everything read from a save: cards plus the quest facts we look for (null = unknown). */
export interface SaveData {
  cards: SaveCards
  facts: string[] | null
}

export interface MissableGroup {
  cardIds: number[]
  questName: string
  region: string
  /** Quest after which the cards are lost. null = no hard cutoff. */
  cutoff: string | null
  details: string | null
  notes: string[]
  /** Save facts meaning the cutoff has passed; a trailing `*` matches a prefix. */
  passedWhen: string[]
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
  achievement: boolean
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
  /** Cutoff already passed in this save; null when the save can't tell. */
  passed: boolean | null
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
    /** "Collect 'Em All" progress: card names and leaders the game counts. */
    achievementOwned: number
    achievementTotal: number
  }
}
