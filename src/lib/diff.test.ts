import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { catalog } from './catalog'
import { diff, groupKey, parseSaveJson } from './diff'
import type { SaveCards } from './types'

// a.txt is the acceptance fixture: a real converted save.
const fixture = parseSaveJson(readFileSync(new URL('../../a.txt', import.meta.url), 'utf8'))

describe('parseSaveJson', () => {
  it('accepts the a.txt shape and the bare map', () => {
    expect(parseSaveJson('{"gwentCards":{"0":{"count":2,"name":"Decoy"}}}')).toEqual({ 0: { count: 2, name: 'Decoy' } })
    expect(parseSaveJson('{"0":{"count":2,"name":"Decoy"}}')).toEqual({ 0: { count: 2, name: 'Decoy' } })
  })

  it('rejects junk with a readable message', () => {
    expect(() => parseSaveJson('not json')).toThrow(/valid JSON/)
    expect(() => parseSaveJson('[]')).toThrow(/gwentCards/)
    expect(() => parseSaveJson('{"gwentCards":{}}')).toThrow(/No Gwent cards/)
  })
})

describe('diff against a.txt', () => {
  const base = diff(catalog, fixture, false)
  const all = diff(catalog, fixture, true)

  it('totals the base game at 199 copies', () => {
    expect(base.totals.copiesTotal).toBe(199)
    expect(base.totals.copiesOwned).toBeGreaterThan(0)
    expect(base.totals.copiesOwned).toBeLessThanOrEqual(199)
    expect(base.totals.namesOwned).toBeLessThanOrEqual(base.totals.namesTotal)
  })

  it('base view contains no DLC cards; DLC toggle widens totals', () => {
    expect(base.groups.every((g) => g.source === 'BaseGame')).toBe(true)
    expect(all.totals.copiesTotal).toBeGreaterThan(base.totals.copiesTotal)
    expect(all.groups.some((g) => g.source === 'BloodAndWine')).toBe(true)
  })

  it('missing and incomplete are disjoint and consistent with counts', () => {
    for (const g of base.missing) expect(g.have).toBe(0)
    for (const g of base.incomplete) expect(g.have).toBeGreaterThan(0)
    for (const g of base.incomplete) expect(g.have).toBeLessThan(g.total)
    const keys = new Set(base.missing.map((g) => g.key))
    expect(base.incomplete.some((g) => keys.has(g.key))).toBe(false)
  })

  it('a card with full copies in the save is not reported', () => {
    // Decoy: 3/3 in a.txt.
    expect(fixture[0].count).toBe(3)
    const reported = [...base.missing, ...base.incomplete].map((g) => g.name)
    expect(reported).not.toContain('Decoy')
  })

  it('a partially owned card is reported as incomplete', () => {
    // Scorch: 2/3 in a.txt.
    expect(fixture[2].count).toBe(2)
    expect(base.incomplete.find((g) => g.name === 'Scorch')).toMatchObject({ have: 2, total: 3 })
  })

  it('surfaces unknown indices with copies, skipping zero-count entries', () => {
    const indices = base.unknownInSave.map((u) => u.index)
    expect(indices).toContain(131)
    expect(indices).not.toContain(26) // GOG artwork Geralt, count 0
  })
})

describe('diff rules', () => {
  const pick = (...indices: number[]) => catalog.cards.filter((c) => indices.includes(c.index))

  it('summons inherit their parent copies', () => {
    const summon = catalog.cards.find((c) => c.attachedTo != null && c.source === 'BloodAndWine')!
    const owned: SaveCards = { [summon.attachedTo!]: { count: 1, name: '' } }
    const result = diff({ cards: pick(summon.index, summon.attachedTo!), missables: [] }, owned, true)
    expect(result.missing).toHaveLength(0)
  })

  it('clamps over-reported copies to maxCopies', () => {
    const owned: SaveCards = { 0: { count: 9, name: 'Decoy' } }
    const result = diff({ cards: pick(0), missables: [] }, owned, false)
    expect(result.totals.copiesOwned).toBe(3)
  })

  it('missable group is reported until every card in it is owned', () => {
    const group = catalog.missables[0]
    const cards = pick(...group.cardIds)
    const some: SaveCards = { [group.cardIds[0]]: { count: 1, name: '' } }
    const every: SaveCards = Object.fromEntries(group.cardIds.map((id) => [id, { count: 1, name: '' }]))
    expect(diff({ cards, missables: [group] }, some, true).missables).toHaveLength(group.cardIds.length > 1 ? 1 : 0)
    expect(diff({ cards, missables: [group] }, every, true).missables).toHaveLength(0)
  })
})

describe('mark as complete', () => {
  const base = diff(catalog, fixture, false)

  it('moves a missing card out of missing and into marked, updating totals', () => {
    const target = base.missing[0]
    const result = diff(catalog, fixture, false, new Set([target.key]))
    expect(result.missing.map((g) => g.key)).not.toContain(target.key)
    expect(result.marked.map((g) => g.key)).toEqual([target.key])
    expect(result.totals.copiesOwned).toBe(base.totals.copiesOwned + target.total)
    expect(result.totals.namesOwned).toBe(base.totals.namesOwned + 1)
  })

  it('fills an incomplete card to full copies', () => {
    const scorch = base.incomplete.find((g) => g.name === 'Scorch')!
    const result = diff(catalog, fixture, false, new Set([scorch.key]))
    expect(result.incomplete.map((g) => g.key)).not.toContain(scorch.key)
    expect(result.groups.find((g) => g.key === scorch.key)).toMatchObject({ have: 3, total: 3, marked: true })
  })

  it('clears a missable warning once its cards are marked', () => {
    const at = base.missables[0]
    const keys = new Set(at.missing.map(groupKey))
    expect(diff(catalog, fixture, false, keys).missables).not.toContainEqual(expect.objectContaining({ group: at.group }))
  })

  it('does not list a mark the save already satisfies', () => {
    const decoy = base.groups.find((g) => g.name === 'Decoy')!
    expect(diff(catalog, fixture, false, new Set([decoy.key])).marked).toHaveLength(0)
  })
})
