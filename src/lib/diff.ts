import type { Catalog, CardGroup, DiffResult, Location, MissableStatus, ReferenceCard, SaveCards } from './types'

/**
 * Parses an uploaded collection file. Accepts the a.txt shape
 * `{"gwentCards": {...}}` or the bare `{"<index>": {...}}` map.
 * Throws an Error with a user-facing message on bad input.
 */
export function parseSaveJson(text: string): SaveCards {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("That file isn't valid JSON.")
  }
  const map = isRecord(data) && 'gwentCards' in data ? data.gwentCards : data
  if (!isRecord(map)) throw new Error('Expected an object of the form {"gwentCards": {...}}.')

  const out: SaveCards = {}
  for (const [key, value] of Object.entries(map)) {
    if (!/^\d+$/.test(key) || !isRecord(value) || typeof value.count !== 'number') continue
    out[key] = { count: value.count, name: typeof value.name === 'string' ? value.name : '' }
  }
  if (Object.keys(out).length === 0) throw new Error('No Gwent cards found in that file.')
  return out
}

export function diff(catalog: Catalog, owned: SaveCards, includeDlc: boolean): DiffResult {
  const inScope = (c: ReferenceCard) => includeDlc || c.source === 'BaseGame'
  const byIndex = new Map(catalog.cards.map((c) => [c.index, c]))

  // Copies held per index, clamped to maxCopies (some saves over-report
  // leaders). Summons mirror their parent since the save never lists them.
  const haveOf = (c: ReferenceCard): number => {
    const index = c.attachedTo ?? c.index
    return Math.min(Math.max(owned[index]?.count ?? 0, 0), c.maxCopies)
  }

  const groupMap = new Map<string, CardGroup>()
  for (const card of catalog.cards) {
    if (!inScope(card)) continue
    const key = `${card.deck}/${card.name}`
    let g = groupMap.get(key)
    if (!g) {
      g = {
        key,
        name: card.name,
        deck: card.deck,
        type: card.type,
        source: card.source,
        missable: false,
        flavor: card.flavor,
        cards: [],
        have: 0,
        total: 0,
        locations: [],
      }
      groupMap.set(key, g)
    }
    g.cards.push(card)
    g.missable ||= card.missable
    g.have += haveOf(card)
    g.total += card.maxCopies
    g.locations = mergeLocations(g.locations, card.locations)
  }
  const groups = [...groupMap.values()]

  const missing = groups.filter((g) => g.have === 0)
  const incomplete = groups.filter((g) => g.have > 0 && g.have < g.total)

  const missables: MissableStatus[] = []
  for (const group of catalog.missables) {
    const cards = group.cardIds.map((id) => byIndex.get(id)).filter((c): c is ReferenceCard => !!c && inScope(c))
    const lacking = cards.filter((c) => haveOf(c) === 0)
    if (lacking.length) missables.push({ group, missing: lacking })
  }

  const unknownInSave = Object.entries(owned)
    .map(([k, raw]) => ({ index: Number(k), raw }))
    .filter(({ index, raw }) => raw.count > 0 && !byIndex.has(index))
    .sort((a, b) => a.index - b.index)

  const names = new Map<string, boolean>()
  for (const g of groups) names.set(g.name, (names.get(g.name) ?? false) || g.have > 0)

  return {
    groups,
    missing,
    incomplete,
    missables,
    unknownInSave,
    totals: {
      namesOwned: [...names.values()].filter(Boolean).length,
      namesTotal: names.size,
      copiesOwned: groups.reduce((n, g) => n + g.have, 0),
      copiesTotal: groups.reduce((n, g) => n + g.total, 0),
    },
  }
}

/** Human-readable one-liner for a location. */
export function describeLocation(l: Location): string {
  const who = l.npc ?? l.quest
  const where = [l.area, l.territory, l.region].filter(Boolean).join(', ')
  return [l.type, who, where].filter(Boolean).join(' — ')
}

function mergeLocations(a: Location[], b: Location[]): Location[] {
  const seen = new Set(a.map(describeLocation))
  return [...a, ...b.filter((l) => !seen.has(describeLocation(l)))]
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
