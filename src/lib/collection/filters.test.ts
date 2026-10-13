import { describe, expect, it } from 'vitest'
import type { CardGroup, Location, ReferenceCard } from '../types'
import { abilitiesOf, filterGroups, NO_FILTERS, regionsOf, sourceKind } from './filters'

const group = (name: string, locations: Location[]): CardGroup => ({
  key: `Neutral/${name}`,
  name,
  deck: 'Neutral',
  type: 'Unit',
  source: 'BaseGame',
  missable: false,
  achievement: false,
  cards: [],
  have: 0,
  total: 1,
  marked: false,
  locations,
})

const novigradShop = group('Shop card', [{ type: 'Buy from Trader', npc: 'Merchant', region: 'Novigrad' }])
const velenDuel = group('Duel card', [{ type: 'Win from NPC', npc: 'Innkeeper', region: 'Velen' }])
const mixed = group('Mixed card', [
  { type: 'Win from NPC', npc: 'Merchant', region: 'Novigrad' },
  { type: 'Buy from Trader', npc: 'Smith', region: 'Velen' },
])
const random = group('Random card', [{ type: 'Win from NPC', npc: 'Random' }])
const all = [novigradShop, velenDuel, mixed, random]

describe('filters', () => {
  it('maps location types to source kinds', () => {
    expect(sourceKind({ type: 'Buy from Trader' })).toBe('buy')
    expect(sourceKind({ type: 'Win from NPC' })).toBe('win')
    expect(sourceKind({ type: 'Gwent Quest' })).toBe('quest')
    expect(sourceKind({ type: 'Base Deck' })).toBe('other')
  })

  it('lists real map regions, most common first', () => {
    expect(regionsOf(all)).toEqual(['Novigrad', 'Velen'])
  })

  it('filters by region', () => {
    expect(filterGroups(all, { ...NO_FILTERS, region: 'Novigrad' }).map((g) => g.name)).toEqual([
      'Shop card',
      'Mixed card',
    ])
  })

  it('region and kind must match the same location', () => {
    // Mixed card: "win" is in Novigrad, "buy" is in Velen.
    expect(filterGroups(all, { ...NO_FILTERS, region: 'Novigrad', kind: 'buy' }).map((g) => g.name)).toEqual([
      'Shop card',
    ])
    expect(filterGroups(all, { ...NO_FILTERS, region: 'Velen', kind: 'buy' }).map((g) => g.name)).toEqual([
      'Mixed card',
    ])
  })

  it('combines text search with filters', () => {
    expect(filterGroups(all, { ...NO_FILTERS, query: 'merchant', kind: 'win' }).map((g) => g.name)).toEqual([
      'Mixed card',
    ])
  })
})

describe('ability and achievement filters', () => {
  const spy = {
    ...group('Spy card', []),
    achievement: true,
    cards: [{ index: 1, abilities: ['spy', 'hero'], rows: ['siege'] } as unknown as ReferenceCard],
  }
  const groups = [...all, spy]

  it('lists abilities present, by label', () => {
    expect(abilitiesOf(groups)).toEqual(['hero', 'spy'])
  })

  it('filters by ability, achievement and ability text', () => {
    expect(filterGroups(groups, { ...NO_FILTERS, ability: 'spy' }).map((g) => g.name)).toEqual(['Spy card'])
    expect(filterGroups(groups, { ...NO_FILTERS, achievement: true }).map((g) => g.name)).toEqual(['Spy card'])
    expect(filterGroups(groups, { ...NO_FILTERS, query: 'hero' }).map((g) => g.name)).toEqual(['Spy card'])
  })
})

describe('checklistText', async () => {
  const { checklistText } = await import('./export')
  it('groups by deck with checkboxes, remaining copies and first location', () => {
    const text = checklistText('Missing', [
      { ...velenDuel, total: 3, have: 1 },
      { ...novigradShop, missable: true },
    ])
    expect(text).toBe(
      'Missing (2)\n\nNeutral\n[ ] Duel card ×2 — Win from NPC — Innkeeper — Velen\n[ ] Shop card (MISSABLE) — Buy from Trader — Merchant — Novigrad\n',
    )
  })
})
