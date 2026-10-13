// Reads the Gwent card collection straight out of a Witcher 3 .sav file,
// entirely in the browser. A minimal port of the reading logic in
// rfvgyhn/W3SavegameEditor (MIT), limited to what the tracker needs.
//
// File layout:
//   "SNFH" "FZLC" chunkCount:i32 headerSize:i32
//   chunkCount × { compressed:i32, decompressed:i32, endOffset:i32 }
//   ...LZ4 block chunks from headerSize onward.
// The decompressed buffer is addressed as if the header were still in
// front (data starts at headerSize), because all inner offsets are absolute.
//
// Decompressed body:
//   "SAV3" ... variables ... string table ("NM" + MANU name list) ...
//   variable table (count, {offset:i32, size:i32}[]) ... varTableOffset:i32 "SE"
//
// Gwent cards live inside the "CR4GwintManager" BS (set) variable as a run
// of VL variables: cardIndex / numCopies pairs, ending at SBSelectedDeckIndex.
import type { SaveCards } from './types'

export class SaveParseError extends Error {}

const ascii = (b: Uint8Array, offset: number, length: number) =>
  String.fromCharCode(...b.subarray(offset, offset + length))

/** True if the bytes look like a Witcher 3 save (cheap magic-number check). */
export function isSaveFile(head: Uint8Array): boolean {
  return head.length >= 8 && ascii(head, 0, 8) === 'SNFHFZLC'
}

/** Decodes one raw LZ4 block into `dst` at `dstPos`; returns bytes written. */
export function lz4DecodeBlock(src: Uint8Array, dst: Uint8Array, dstPos: number): number {
  const start = dstPos
  let s = 0
  while (s < src.length) {
    const token = src[s++]
    let literals = token >> 4
    if (literals === 15) {
      let b
      do literals += b = src[s++]
      while (b === 255)
    }
    dst.set(src.subarray(s, s + literals), dstPos)
    s += literals
    dstPos += literals
    if (s >= src.length) break // last sequence is literals only

    const offset = src[s] | (src[s + 1] << 8)
    s += 2
    if (offset === 0 || offset > dstPos - start) throw new SaveParseError('Corrupt save data (bad LZ4 offset).')
    let length = token & 15
    if (length === 15) {
      let b
      do length += b = src[s++]
      while (b === 255)
    }
    length += 4
    // Byte-by-byte: matches may overlap their own output.
    for (let m = dstPos - offset, end = dstPos + length; dstPos < end; ) dst[dstPos++] = dst[m++]
  }
  return dstPos - start
}

function decompress(file: Uint8Array): Uint8Array {
  if (!isSaveFile(file)) throw new SaveParseError("That doesn't look like a Witcher 3 save file.")
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength)
  const chunkCount = view.getInt32(8, true)
  const headerSize = view.getInt32(12, true)
  if (chunkCount <= 0 || chunkCount > 10_000 || headerSize < 16 + chunkCount * 12 || headerSize > file.length)
    throw new SaveParseError('Corrupt save file header.')

  const chunks: { compressed: number; decompressed: number }[] = []
  let total = headerSize
  for (let i = 0; i < chunkCount; i++) {
    const o = 16 + i * 12
    const chunk = { compressed: view.getInt32(o, true), decompressed: view.getInt32(o + 4, true) }
    if (chunk.compressed < 0 || chunk.decompressed < 0) throw new SaveParseError('Corrupt save file header.')
    chunks.push(chunk)
    total += chunk.decompressed
  }
  if (total > 256 * 1024 * 1024) throw new SaveParseError('Save file is unexpectedly large.')

  const out = new Uint8Array(total)
  let inPos = headerSize
  let outPos = headerSize
  for (const chunk of chunks) {
    if (inPos + chunk.compressed > file.length) throw new SaveParseError('Save file is truncated.')
    const written = lz4DecodeBlock(file.subarray(inPos, inPos + chunk.compressed), out, outPos)
    if (written !== chunk.decompressed) throw new SaveParseError('Corrupt save data (chunk size mismatch).')
    inPos += chunk.compressed
    outPos += chunk.decompressed
  }
  return out
}

/** Extracts `{ "<cardIndex>": { count } }` from a .sav file's bytes. */
export function parseSave(file: Uint8Array): SaveCards {
  const data = decompress(file)
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const headerSize = new DataView(file.buffer, file.byteOffset).getInt32(12, true)
  const check = (ok: boolean, what: string) => {
    if (!ok) throw new SaveParseError(`Unsupported save format (${what}).`)
  }
  const inBounds = (o: number, n = 1) => o >= 0 && o + n <= data.length

  check(ascii(data, headerSize, 4) === 'SAV3', 'missing SAV3 header')
  check(ascii(data, data.length - 2, 2) === 'SE', 'missing footer')

  // String table: every variable and type name, referenced by 1-based index.
  const varTable = view.getInt32(data.length - 6, true)
  check(inBounds(varTable - 10, 4) && inBounds(varTable, 4), 'bad table offset')
  const nm = view.getInt32(varTable - 10, true)
  check(inBounds(nm, 14) && ascii(data, nm, 2) === 'NM' && ascii(data, nm + 2, 4) === 'MANU', 'bad string table')
  let p = nm + 6
  const nameCount = view.getInt32(p, true)
  p += 8
  check(nameCount > 0 && nameCount < 1_000_000, 'bad string table')
  const names: string[] = []
  for (let i = 0; i < nameCount; i++) {
    const len = data[p++]
    check(inBounds(p, len), 'bad string table')
    names.push(ascii(data, p, len))
    p += len
  }
  const nameAt = (o: number) => names[view.getInt16(o, true) - 1]

  // Variable table, sorted by offset so a set's children follow it.
  const entryCount = view.getInt32(varTable, true)
  check(entryCount > 0 && inBounds(varTable + 4, entryCount * 8), 'bad variable table')
  const entries: { offset: number; size: number }[] = []
  for (let i = 0; i < entryCount; i++) {
    const o = varTable + 4 + i * 8
    entries.push({ offset: view.getInt32(o, true), size: view.getInt32(o + 4, true) })
  }
  entries.sort((a, b) => a.offset - b.offset)

  const gwint = entries.findIndex(
    (e) => inBounds(e.offset, 4) && ascii(data, e.offset, 2) === 'BS' && nameAt(e.offset + 2) === 'CR4GwintManager',
  )
  if (gwint < 0) throw new SaveParseError('No Gwent data found in this save.')

  const end = entries[gwint].offset + entries[gwint].size
  const cards: SaveCards = {}
  let pendingIndex: number | null = null
  for (let i = gwint + 1; i < entries.length && entries[i].offset < end; i++) {
    const o = entries[i].offset
    if (!inBounds(o, 10) || ascii(data, o, 2) !== 'VL') continue
    const name = nameAt(o + 2)
    if (name === 'SBSelectedDeckIndex') break
    if (names[view.getInt16(o + 4, true) - 1] !== 'Int32') continue
    const value = view.getInt32(o + 6, true)
    if (name === 'cardIndex') pendingIndex = value
    else if (name === 'numCopies' && pendingIndex !== null) {
      const prev = cards[pendingIndex]?.count ?? 0
      cards[pendingIndex] = { count: prev + value, name: '' }
      pendingIndex = null
    }
  }
  if (Object.keys(cards).length === 0) throw new SaveParseError('No Gwent cards found in this save.')
  return cards
}
