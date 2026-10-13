// One-time fetch of full card faces into public/cards/<index>.webp.
// Source: the Witcher fandom wiki's in-game card renders, mapped per index in
// data/card-faces.json. We self-host resized copies so the live site never
// hotlinks a third-party host. Existing files are skipped unless --force.
//   node scripts/fetch-card-art.mjs [--force]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const WIDTH = 280 // ~2x the largest on-screen size
const CONCURRENCY = 6
const force = process.argv.includes('--force')

const faces = JSON.parse(readFileSync(join(root, 'data/card-faces.json'), 'utf8'))
const outDir = join(root, 'public/cards')
mkdirSync(outDir, { recursive: true })

const queue = Object.entries(faces).filter(([i]) => force || !existsSync(join(outDir, `${i}.webp`)))
const failed = []
let done = 0

async function worker() {
  for (let item = queue.shift(); item; item = queue.shift()) {
    const [index, url] = item
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'GwentTracker card-art fetch' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const img = Buffer.from(await res.arrayBuffer())
      const webp = await sharp(img).resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
      writeFileSync(join(outDir, `${index}.webp`), webp)
      done++
    } catch (e) {
      failed.push(`${index} (${url}): ${e.message}`)
    }
  }
}

const total = queue.length
await Promise.all(Array.from({ length: CONCURRENCY }, worker))
console.log(`card art: ${done}/${total} fetched${failed.length ? `, failed:\n  ${failed.join('\n  ')}` : ''}`)
process.exit(failed.length ? 1 : 0)
