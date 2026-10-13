import { DECK_ORDER } from '../display'
import type { CardGroup } from '../types'
import { describeLocation } from './diff'

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
