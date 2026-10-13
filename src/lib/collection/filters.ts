import type { CardGroup, Location } from '../types'
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
}

export const NO_FILTERS: Filters = { query: '', region: null, kind: null }

/**
 * Text search over name/deck/type/locations; region and kind must match the
 * same location (e.g. "buy" + "Novigrad" = a Novigrad merchant).
 */
export function filterGroups(groups: CardGroup[], f: Filters): CardGroup[] {
  const q = f.query.trim().toLowerCase()
  return groups.filter((g) => {
    if (q && ![g.name, g.deck, g.type, ...g.locations.map(describeLocation)].some((s) => s.toLowerCase().includes(q)))
      return false
    if (!f.region && !f.kind) return true
    return g.locations.some(
      (l) => (!f.region || l.region === f.region) && (!f.kind || sourceKind(l) === f.kind),
    )
  })
}
