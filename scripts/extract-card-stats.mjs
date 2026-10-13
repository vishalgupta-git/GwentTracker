// One-time extraction of card stats (strength, rows, abilities) from an
// installed copy of The Witcher 3 into data/card-stats.json. The output is
// committed, so the site builds without the game.
//   node scripts/extract-card-stats.mjs "/path/to/The Witcher 3"
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateSync } from 'node:zlib'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const gameDir = process.argv[2]
if (!gameDir) {
  console.error('usage: node scripts/extract-card-stats.mjs "/path/to/The Witcher 3"')
  process.exit(1)
}

/** Reads one file out of a POTATO70 bundle (0x130-byte entries, zlib or stored). */
function readFromBundle(bundlePath, wanted) {
  const d = readFileSync(bundlePath)
  if (d.toString('latin1', 0, 8) !== 'POTATO70') throw new Error(`${bundlePath}: not a bundle`)
  const tableSize = d.readUInt32LE(16)
  for (let pos = 0x20; pos < tableSize + 0x20; pos += 0x130) {
    const name = d.toString('latin1', pos, pos + 0x100).replace(/\0.*$/s, '')
    if (name !== wanted) continue
    const offset = Number(d.readBigUInt64LE(pos + 0x110))
    const zsize = d.readUInt32LE(pos + 0x11c)
    const type = d.readUInt32LE(pos + 0x124)
    const raw = d.subarray(offset, offset + zsize)
    if (type === 0) return raw.toString('utf8')
    if (type === 1) return inflateSync(raw).toString('utf8')
    throw new Error(`${wanted}: unsupported compression ${type}`)
  }
  throw new Error(`${wanted} not found in ${bundlePath}`)
}

// Game effect flags → our ability ids. Weather and other specials are covered
// by the card type; leaders keep their own (unextracted) ability text.
const EFFECTS = {
  EFFECT_SAME_TYPE_MORALE: 'tightBond',
  EFFECT_IMPROVE_NEIGHBOURS: 'moraleBoost',
  EFFECT_NURSE: 'medic',
  EFFECT_SUMMON_CLONES: 'muster',
  EFFECT_HORN: 'horn',
  EFFECT_SCORCH: 'scorch',
  EFFECT_MELEE_SCORCH: 'scorch',
  CP_MELEE_SCORCH: 'scorch',
  CP_SIEGE_SCORCH: 'scorch',
  EFFECT_RANGED_SCORCH: 'scorch',
  EFFECT_MUSHROOM: 'mardroeme',
  EFFECT_MORPH: 'berserker',
  EFFECT_SUICIDE_SUMMON: 'avenger',
  EFFECT_UNSUMMON_DUMMY: 'decoy',
  EFFECT_CLEAR_SKY: 'weather',
}
const WEATHER = { EFFECT_MELEE: 'melee', EFFECT_RANGED: 'ranged', EFFECT_SIEGE: 'siege' }

const xml = readFromBundle(
  join(gameDir, 'content/content0/bundles/xml.bundle'),
  'gameplay\\items_plus\\def_gwint_cards_final.xml',
).replace(/<!--[\s\S]*?-->/g, '')

const stats = {}
for (const [, attrs, body] of xml.matchAll(/<card\s+([^>]*)>([\s\S]*?)<\/card>/g)) {
  const a = Object.fromEntries([...attrs.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]))
  const types = [...(body.match(/<type_flags>([\s\S]*?)<\/type_flags>/)?.[1] ?? '').matchAll(/name="(\w+)"/g)].map((m) => m[1])
  const effects = [...(body.match(/<effect_flags>([\s\S]*?)<\/effect_flags>/)?.[1] ?? '').matchAll(/name="(\w+)"/g)].map((m) => m[1])
  const isUnit = types.includes('TYPE_CREATURE')
  const isWeather = types.includes('TYPE_WEATHER')

  const rows = isUnit
    ? ['melee', 'ranged', 'siege'].filter((r) => types.includes(`TYPE_${r.toUpperCase()}`))
    : isWeather
      ? effects.map((e) => WEATHER[e]).filter(Boolean)
      : []
  const abilities = new Set(effects.map((e) => EFFECTS[e]).filter(Boolean))
  if (isWeather) abilities.add('weather')
  if (types.includes('TYPE_SPY')) abilities.add('spy')
  if (types.includes('TYPE_HERO')) abilities.add('hero')
  if (isUnit && rows.length > 1) abilities.add('agile')

  const entry = { rows, abilities: [...abilities].sort() }
  if (isUnit) entry.strength = Number(a.power)
  stats[a.index] = entry
}

const out = join(root, 'data/card-stats.json')
writeFileSync(out, JSON.stringify(stats, null, 1) + '\n')
console.log(`card stats: ${Object.keys(stats).length} cards → ${out.slice(root.length + 1)}`)
