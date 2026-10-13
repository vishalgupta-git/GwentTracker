import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { isSaveFile, lz4DecodeBlock, parseSave, SaveParseError } from './save'

const enc = (s: string) => [...s].map((c) => c.charCodeAt(0))
const i16 = (n: number) => [n & 0xff, (n >> 8) & 0xff]
const i32 = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff]

/** LZ4 block holding `data` as one literal run (valid, just uncompressed). */
function lz4Literal(data: number[]): number[] {
  const len = data.length
  if (len < 15) return [len << 4, ...data]
  const extra: number[] = []
  let rest = len - 15
  while (rest >= 255) {
    extra.push(255)
    rest -= 255
  }
  extra.push(rest)
  return [0xf0, ...extra, ...data]
}

/**
 * Builds a minimal save: SAV3, a CR4GwintManager set holding cardIndex /
 * numCopies pairs, a trailing SBSelectedDeckIndex, string table, variable
 * table and footer, wrapped in the chunked LZ4 container.
 */
function buildSave(cards: [number, number][]): Uint8Array {
  const names = ['CR4GwintManager', 'cardIndex', 'numCopies', 'Int32', 'SBSelectedDeckIndex']
  const id = (n: string) => names.indexOf(n) + 1
  const HEADER = 16 + 12 // one chunk
  const body: number[] = [...enc('SAV3'), ...i32(0), ...i32(0), ...i32(0)]
  const vars: { offset: number; size: number }[] = []
  const at = () => HEADER + body.length

  const set = { offset: at(), size: 0 }
  vars.push(set)
  body.push(...enc('BS'), ...i16(id('CR4GwintManager')))
  const vl = (name: string, value: number) => {
    vars.push({ offset: at(), size: 10 })
    body.push(...enc('VL'), ...i16(id(name)), ...i16(id('Int32')), ...i32(value))
  }
  for (const [index, copies] of cards) {
    vl('cardIndex', index)
    vl('numCopies', copies)
  }
  vl('SBSelectedDeckIndex', 0)
  set.size = at() - set.offset

  const nm = at()
  body.push(...enc('NM'), ...enc('MANU'), ...i32(names.length), ...i32(0))
  for (const n of names) body.push(n.length, ...enc(n))
  body.push(...i32(0), ...enc('ENOD'))
  body.push(...i32(nm), ...i32(0), ...i16(0)) // string table footer (nm, rb, pad) = 10 bytes
  const varTable = at()
  body.push(...i32(vars.length))
  for (const v of [...vars].reverse()) body.push(...i32(v.offset), ...i32(v.size)) // unsorted on purpose
  body.push(...i32(varTable), ...enc('SE'))

  const chunk = lz4Literal(body)
  return new Uint8Array([
    ...enc('SNFHFZLC'),
    ...i32(1),
    ...i32(HEADER),
    ...i32(chunk.length),
    ...i32(body.length),
    ...i32(HEADER + chunk.length),
    ...chunk,
  ])
}

describe('lz4DecodeBlock', () => {
  it('decodes literals and overlapping matches', () => {
    // "abc" then a 6-byte match at offset 3 -> "abcabcabc"
    const src = new Uint8Array([(3 << 4) | 2, ...enc('abc'), 3, 0])
    const dst = new Uint8Array(9)
    expect(lz4DecodeBlock(src, dst, 0)).toBe(9)
    expect(String.fromCharCode(...dst)).toBe('abcabcabc')
  })

  it('rejects a match pointing before the block', () => {
    const src = new Uint8Array([(1 << 4) | 0, 0x61, 9, 0])
    expect(() => lz4DecodeBlock(src, new Uint8Array(10), 0)).toThrow(SaveParseError)
  })
})

describe('parseSave', () => {
  it('reads card index / copies pairs from CR4GwintManager', () => {
    const save = buildSave([
      [0, 3],
      [2, 2],
      [1005, 1],
    ])
    expect(isSaveFile(save)).toBe(true)
    expect(parseSave(save)).toEqual({
      0: { count: 3, name: '' },
      2: { count: 2, name: '' },
      1005: { count: 1, name: '' },
    })
  })

  it('rejects non-save input with a readable message', () => {
    expect(() => parseSave(new TextEncoder().encode('{"gwentCards":{}}'))).toThrow(/Witcher 3 save/)
  })

  it('rejects a truncated save', () => {
    const save = buildSave([[0, 1]])
    expect(() => parseSave(save.subarray(0, save.length - 20))).toThrow(SaveParseError)
  })

  // Optional: GWENT_SAVE=/path/to/file.sav npm test
  const real = process.env.GWENT_SAVE
  it.runIf(real && existsSync(real))('parses a real save', () => {
    const cards = parseSave(new Uint8Array(readFileSync(real!)))
    expect(Object.keys(cards).length).toBeGreaterThan(50)
    expect(cards[0].count).toBeGreaterThan(0) // everyone starts with Decoy
  })
})
