// One-time fetch of card art into public/cards/<index>.webp.
// Source is the image host used by rfvgyhn/gwent-tracker. We self-host the
// resized copies so the live site never hotlinks someone else's bucket.
// Re-run only when cards are added: existing files are skipped.
//   node scripts/fetch-card-art.mjs [--force]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = 'https://rfvgyhn.blob.core.windows.net/gwent/{0}.png'
const WIDTH = 300 // ~2x the largest on-screen size
const CONCURRENCY = 8
const force = process.argv.includes('--force')

const catalogFile = join(root, 'src/lib/data/catalog.json')
if (!existsSync(catalogFile)) {
  console.error('Run `npm run catalog` first.')
  process.exit(1)
}
const { cards } = JSON.parse(readFileSync(catalogFile, 'utf8'))
const outDir = join(root, 'public/cards')
mkdirSync(outDir, { recursive: true })

const queue = cards.map((c) => c.index).filter((i) => force || !existsSync(join(outDir, `${i}.webp`)))
const failed = []
let done = 0

async function worker() {
  for (let index = queue.shift(); index !== undefined; index = queue.shift()) {
    try {
      const res = await fetch(SOURCE.replace('{0}', index))
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const png = Buffer.from(await res.arrayBuffer())
      const webp = await sharp(png).resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()
      writeFileSync(join(outDir, `${index}.webp`), webp)
      done++
    } catch (e) {
      failed.push(`${index}: ${e.message}`)
    }
  }
}

const total = queue.length
await Promise.all(Array.from({ length: CONCURRENCY }, worker))
console.log(`card art: ${done}/${total} fetched${failed.length ? `, failed:\n  ${failed.join('\n  ')}` : ''}`)
process.exit(failed.length ? 1 : 0)
