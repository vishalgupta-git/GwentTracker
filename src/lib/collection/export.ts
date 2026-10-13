import { DECK_ORDER } from '../display'
import type { CardGroup } from '../types'
import { describeLocation } from './diff'
import { SOURCE_KIND_LABEL } from './filters'
import type { Route } from './route'

/** Plain-text checklist, grouped by deck, for copying into notes. */
export function checklistText(title: string, groups: CardGroup[]): string {
  const order = (d: string) => DECK_ORDER.indexOf(d) + 1 || 99
  const decks = new Map<string, CardGroup[]>()
  for (const g of [...groups].sort((a, b) => order(a.deck) - order(b.deck) || a.name.localeCompare(b.name)))
    decks.set(g.deck, [...(decks.get(g.deck) ?? []), g])

  const lines = [`${title} (${groups.length})`]
  for (const [deck, items] of decks) {
    lines.push('', `${deck}`)
    for (const g of items) {
      const need = g.total - g.have > 1 ? ` ×${g.total - g.have}` : ''
      const where = g.locations[0] ? ` — ${describeLocation(g.locations[0])}` : ''
      lines.push(`[ ] ${g.name}${need}${g.missable ? ' (MISSABLE)' : ''}${where}`)
    }
  }
  return lines.join('\n') + '\n'
}

/** Plain-text route: region → who to visit → cards to get there. */
export function routeText(route: Route): string {
  const item = (g: CardGroup) => {
    const need = g.total - g.have > 1 ? ` ×${g.total - g.have}` : ''
    return `    [ ] ${g.name}${need}${g.missable ? ' (MISSABLE)' : ''}`
  }
  const lines = ['Gwent card route']
  for (const r of route.regions) {
    lines.push('', `${r.region} (${r.cardCount})`)
    for (const s of r.stops) {
      const kinds = s.kinds.map((k) => SOURCE_KIND_LABEL[k]).join('/')
      lines.push(`  ${s.who}${s.place ? ` — ${s.place}` : ''} [${kinds}]`, ...s.cards.map(item))
    }
  }
  if (route.random.length)
    lines.push('', `Random merchant rewards (${route.random.length})`, ...route.random.map(item))
  return lines.join('\n') + '\n'
}
