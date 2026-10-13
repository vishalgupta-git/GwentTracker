import { describe, expect, it } from 'vitest'
import { catalog } from './catalog'
import { BASE_GAME, diff } from './diff'
import { routeText } from './export'
import { planRoute } from './route'

describe('planRoute', () => {
  const result = diff(catalog, {}, BASE_GAME)
  const route = planRoute(result.missing)

  it('puts every needed card somewhere', () => {
    const placed = new Set([...route.regions.flatMap((r) => r.stops.flatMap((s) => s.cards)), ...route.random])
    const starterOnly = result.missing.filter((g) => g.locations.every((l) => l.type === 'Base Deck'))
    expect(placed.size + starterOnly.length).toBe(result.missing.length)
  })

  it('sorts regions and stops by how many cards they offer', () => {
    const counts = route.regions.map((r) => r.cardCount)
    expect(counts).toEqual([...counts].sort((a, b) => b - a))
    for (const r of route.regions) {
      const sizes = r.stops.map((s) => s.cards.length)
      expect(sizes).toEqual([...sizes].sort((a, b) => b - a))
    }
  })

  it('collects random merchant rewards separately', () => {
    expect(route.random.map((g) => g.name)).toContain('Griffin')
    expect(route.regions.some((r) => r.stops.some((s) => s.cards.some((g) => g.name === 'Griffin')))).toBe(false)
  })

  it('names quest givers with their quest', () => {
    const novigrad = route.regions.find((r) => r.region === 'Novigrad')!
    expect(novigrad.stops.map((s) => s.who)).toContain('Thaler (Gwent: Playing Thaler)')
  })

  it('exports a text route', () => {
    const text = routeText(route)
    expect(text).toMatch(/^Gwent card route\n\nNovigrad \(\d+\)\n/)
    expect(text).toContain('  Thaler (Gwent: Playing Thaler) — Seven Cats Inn [Quest]\n')
    expect(text).toContain('Random merchant rewards')
  })
})
