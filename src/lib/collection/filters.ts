import { ABILITY, LEADER_ABILITY } from '../display'
import type { Ability, CardGroup, Location } from '../types'
import { describeLocation } from './diff'

/** How a card is obtained, collapsed from the catalog's location types. */
export type SourceKind = 'buy' | 'win' | 'quest' | 'other'

export const SOURCE_KIND_LABEL: Record<SourceKind, string> = {
  buy: 'Buy',
  win: 'Win',
  quest: 'Quest',
  other: 'Other',
}

export function sourceKind(l: Location): SourceKind {
  switch (l.type) {
    case 'Buy from Trader':
      return 'buy'
    case 'Win from NPC':
      return 'win'
    case 'Gwent Quest':
    case 'Secondary Quest':
      return 'quest'
    default:
      return 'other'
  }
}

// Not places on the map: random encounters and starter decks.
const NON_REGIONS = new Set(['Random', 'Base Deck'])

/** Map regions present in these groups, most common first. */
export function regionsOf(groups: CardGroup[]): string[] {
  const counts = new Map<string, number>()
  for (const g of groups)
    for (const r of new Set(g.locations.map((l) => l.region)))
      if (r && !NON_REGIONS.has(r)) counts.set(r, (counts.get(r) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([r]) => r)
}

export interface Filters {
  query: string
  region: string | null
  kind: SourceKind | null
  ability: Ability | null
  /** Only cards that count toward "Collect 'Em All". */
  achievement: boolean
}

export const NO_FILTERS: Filters = { query: '', region: null, kind: null, ability: null, achievement: false }

/** Abilities present in these groups, by label. */
export function abilitiesOf(groups: CardGroup[]): Ability[] {
  const found = new Set(groups.flatMap((g) => g.cards[0]?.abilities ?? []))
  return [...found].sort((a, b) => ABILITY[a].label.localeCompare(ABILITY[b].label))
}

/**
 * Text search over name/deck/type/abilities/locations; region and kind must match the
 * same location (e.g. "buy" + "Novigrad" = a Novigrad merchant).
 */
export function filterGroups(groups: CardGroup[], f: Filters): CardGroup[] {
  const q = f.query.trim().toLowerCase()
  return groups.filter((g) => {
    const abilities = g.cards[0]?.abilities ?? []
    const leader = g.cards[0]?.leaderAbility
    const haystack = [
      g.name,
      g.deck,
      g.type,
      ...abilities.map((a) => ABILITY[a].label),
      ...(leader ? [LEADER_ABILITY[leader]] : []),
      ...g.locations.map(describeLocation),
    ]
    if (q && !haystack.some((s) => s.toLowerCase().includes(q))) return false
    if (f.ability && !abilities.includes(f.ability)) return false
    if (f.achievement && !g.achievement) return false
    if (!f.region && !f.kind) return true
    return g.locations.some(
      (l) => (!f.region || l.region === f.region) && (!f.kind || sourceKind(l) === f.kind),
    )
  })
}
