// Builds src/lib/data/catalog.json from the vendored YAMLs in data/catalog/.
// Fails loudly on duplicate indices, missing fields, or dangling references
// so a bad data edit can never ship silently.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { load as parseYaml } from 'js-yaml'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const DECK_FILES = ['neutral', 'northernrealms', 'nilfgaard', 'monsters', 'scoiatael', 'skellige']
const CARD_TYPES = new Set(['Special', 'Hero', 'Unit', 'Leader'])

// DLC classification, mirrored from upstream Card.cs.
const HOS = new Set([17, 18, 19, 20, 21, 368, 478, 1005, 2005, 3005, 4005])
const BW = new Set([22, 23])
function sourceOf(index) {
  if (HOS.has(index)) return 'HeartsOfStone'
  if ((index >= 500 && index < 600) || index > 5000 || BW.has(index)) return 'BloodAndWine'
  return 'BaseGame'
}

// Upstream data has inconsistent casing/whitespace ("Win From NPC", "Base Deck ").
const LOCATION_TYPES = new Map(
  ['Buy from Trader', 'Win from NPC', 'Base Deck', 'Gwent Quest', 'Secondary Quest', 'Summon', 'Loot', 'Random'].map(
    (t) => [t.toLowerCase(), t],
  ),
)

const RANDOM_NPC = 'Any merchant who plays Gwent'
const RANDOM_NOTE =
  'Random reward: the first time you beat each merchant, they give you one card from a pool of 51. Cards never repeat, so beating more merchants gets you more of the pool.'

const errors = []
const fail = (msg) => errors.push(msg)
const str = (v) => (v == null ? '' : String(v).trim())

function load(file) {
  const text = readFileSync(join(root, 'data/catalog', `${file}.yml`), 'utf8').replace(/^﻿/, '')
  return parseYaml(text) ?? []
}

function normalizeLocation(loc, cardIndex) {
  const rawType = str(loc.type)
  const type = LOCATION_TYPES.get(rawType.toLowerCase()) ?? (rawType || 'Unknown')
  if (!LOCATION_TYPES.has(rawType.toLowerCase()))
    console.warn(`warn: card ${cardIndex} has unrecognized location type "${rawType}"`)
  const out = { type }
  let sawRandom = false
  for (const key of ['npc', 'quest', 'area', 'territory', 'region']) {
    // Quest names are upstream translation keys like "id# (Gwent- Velen Players)".
    let v = str(loc[key]).replace(/^id#\s*\((.*)\)$/, '$1').replace(/^Gwent- /, 'Gwent: ')
    // Random encounters fill every field with "Random"; keep just the first.
    if (v === 'Random') {
      if (sawRandom) continue
      sawRandom = true
    }
    if (v) out[key] = v
  }
  // "Random" cards come from the pool in GiveMerchantRandomGwintCardToPlayerQuest
  // (scripts/game/quests/quest_function.ws): the first win against each
  // Gwent-playing merchant gives one card from it, never a repeat.
  if (out.npc === 'Random' || out.type === 'Random') return { type: 'Win from NPC', npc: RANDOM_NPC, note: RANDOM_NOTE }
  return out
}

const cards = []
const seen = new Map()
for (const file of DECK_FILES) {
  for (const raw of load(file)) {
    const index = raw.index
    if (!Number.isInteger(index)) {
      fail(`${file}.yml: card without integer index: ${JSON.stringify(raw).slice(0, 80)}`)
      continue
    }
    if (seen.has(index)) fail(`duplicate index ${index} in ${file}.yml (first seen in ${seen.get(index)}.yml)`)
    seen.set(index, file)

    const name = str(raw.name)
    const deck = str(raw.deck)
    if (!name) fail(`card ${index}: missing name`)
    if (!deck) fail(`card ${index}: missing deck`)

    let type = str(raw.type)
    if (!type) {
      // Two "Young Emissary" entries ship with an empty type; they are units.
      console.warn(`warn: card ${index} (${name}) has no type, defaulting to Unit`)
      type = 'Unit'
    }
    if (!CARD_TYPES.has(type)) fail(`card ${index}: unknown type "${type}"`)

    const card = {
      index,
      name,
      deck,
      type,
      maxCopies: raw.maxCopies ?? 1,
      source: sourceOf(index),
      locations: (raw.locations ?? []).map((l) => normalizeLocation(l, index)),
    }
    const flavor = str(raw.flavor)
    if (flavor) card.flavor = flavor
    if (raw.attachedTo != null) card.attachedTo = raw.attachedTo
    if (raw.aliases != null) card.aliases = raw.aliases
    cards.push(card)
  }
}

// Strength, rows and abilities from the game (scripts/extract-card-stats.mjs).
const stats = JSON.parse(readFileSync(join(root, 'data/card-stats.json'), 'utf8'))
for (const card of cards) {
  const st = stats[card.index]
  if (!st) {
    fail(`card ${card.index}: no stats in data/card-stats.json`)
    continue
  }
  if (st.strength != null) card.strength = st.strength
  if (st.leader) card.leaderAbility = st.leader
  card.rows = st.rows
  card.abilities = st.abilities
}

// Extra save indices for copies of the same card (e.g. crinfrid2, crinfrid3).
for (const card of cards)
  for (const alias of card.aliases ?? []) {
    if (!Number.isInteger(alias)) fail(`card ${card.index}: alias ${alias} is not an integer`)
    else if (seen.has(alias)) fail(`card ${card.index}: alias ${alias} is already used`)
    else seen.set(alias, `alias of ${card.index}`)
  }

// Summons are never stored in the save; they inherit their parent's copies.
const byIndex = new Map(cards.map((c) => [c.index, c]))
for (const card of cards) {
  if (card.attachedTo == null) continue
  const parent = byIndex.get(card.attachedTo)
  if (!parent) fail(`card ${card.index}: attachedTo ${card.attachedTo} does not exist`)
  else card.maxCopies = parent.maxCopies
}

const missables = load('missable').map((raw, i) => {
  const cardIds = raw.cardIds ?? []
  if (!cardIds.length) fail(`missable #${i}: no cardIds`)
  for (const id of cardIds) if (!byIndex.has(id)) fail(`missable #${i}: card ${id} not in catalog`)
  const questName = str(raw.questName)
  const cutoff = str(raw.cutoff)
  return {
    cardIds,
    questName,
    region: str(raw.region),
    // "self" means the quest itself is the point of no return; "None" means no cutoff.
    cutoff: cutoff === 'self' ? questName : cutoff === 'None' ? null : cutoff || null,
    details: str(raw.details) || null,
    notes: (raw.notes ?? []).map(str).filter(Boolean),
    passedWhen: (raw.passedWhen ?? []).map(str).filter(Boolean),
  }
})

const missableIds = new Set(missables.flatMap((m) => m.cardIds))
for (const card of cards) card.missable = missableIds.has(card.index)

// "Collect 'Em All": card names plus leaders the achievement counts.
const achievement = load('achievement')
const achievementIds = new Set([...(achievement.cardIds ?? []), ...(achievement.leaders ?? [])])
for (const id of achievementIds) {
  const card = byIndex.get(id)
  if (!card) fail(`achievement: card ${id} not in catalog`)
  else if (card.source !== 'BaseGame') fail(`achievement: card ${id} is not a base-game card`)
}
for (const card of cards) card.achievement = achievementIds.has(card.index)

if (errors.length) {
  console.error(`catalog build failed:\n  ${errors.join('\n  ')}`)
  process.exit(1)
}

cards.sort((a, b) => a.index - b.index)
const outFile = join(root, 'src/lib/data/catalog.json')
mkdirSync(dirname(outFile), { recursive: true })
writeFileSync(outFile, JSON.stringify({ cards, missables }) + '\n')
console.log(`catalog: ${cards.length} cards, ${missables.length} missable groups → ${outFile.slice(root.length + 1)}`)
