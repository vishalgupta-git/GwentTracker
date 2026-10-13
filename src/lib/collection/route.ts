import type { CardGroup, Location } from '../types'
import { sourceKind, type SourceKind } from './filters'

/** One person or quest to visit, with every needed card they offer. */
export interface Stop {
  key: string
  who: string
  place: string
  kinds: SourceKind[]
  cards: CardGroup[]
}

export interface RegionPlan {
  region: string
  stops: Stop[]
  /** Distinct cards obtainable in this region. */
  cardCount: number
}

export interface Route {
  regions: RegionPlan[]
  /** Cards only available as random merchant rewards (no fixed place). */
  random: CardGroup[]
}

// Starter decks and summons aren't places you can go.
const SKIP = new Set(['Base Deck', 'Summon'])

/**
 * Groups needed cards by region, then by who to visit. Regions and stops with
 * the most cards come first, so the top of the list is the most efficient trip.
 */
export function planRoute(groups: CardGroup[]): Route {
  const regions = new Map<string, Map<string, Stop>>()
  const random: CardGroup[] = []

  for (const g of groups) {
    let placed = false
    for (const l of g.locations) {
      if (SKIP.has(l.type) || !l.region) continue
      placed = true
      const who = l.npc ?? l.quest ?? l.type
      const place = [l.area, l.territory].filter(Boolean).join(', ')
      const key = `${l.region}/${who}/${place}`
      let stops = regions.get(l.region)
      if (!stops) regions.set(l.region, (stops = new Map()))
      let stop = stops.get(key)
      if (!stop) stops.set(key, (stop = { key, who: stopName(l, who), place, kinds: [], cards: [] }))
      const kind = sourceKind(l)
      if (!stop.kinds.includes(kind)) stop.kinds.push(kind)
      if (!stop.cards.includes(g)) stop.cards.push(g)
    }
    if (!placed && g.locations.some((l) => l.note)) random.push(g)
  }

  const byCount = <T extends { cards: unknown[] }>(a: T, b: T) => b.cards.length - a.cards.length
  return {
    regions: [...regions]
      .map(([region, stops]) => {
        const list = [...stops.values()].sort((a, b) => byCount(a, b) || a.who.localeCompare(b.who))
        for (const s of list) s.cards.sort((a, b) => Number(b.missable) - Number(a.missable) || a.name.localeCompare(b.name))
        return { region, stops: list, cardCount: new Set(list.flatMap((s) => s.cards)).size }
      })
      .sort((a, b) => b.cardCount - a.cardCount || a.region.localeCompare(b.region)),
    random,
  }
}

// Quest givers read better with the quest: "Thaler (Gwent: Playing Thaler)".
function stopName(l: Location, who: string): string {
  return l.npc && l.quest ? `${l.npc} (${l.quest})` : who
}
