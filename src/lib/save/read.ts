import type { SaveCards } from '../types'

/** Parses a .sav file in a Web Worker. Rejects with a user-facing message. */
export function readSave(file: File): Promise<SaveCards> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<{ ok: true; cards: SaveCards } | { ok: false; error: string }>) => {
      worker.terminate()
      if (e.data.ok) resolve(e.data.cards)
      else reject(new Error(e.data.error))
    }
    worker.onerror = () => {
      worker.terminate()
      reject(new Error("Couldn't read this save file."))
    }
    file.arrayBuffer().then((buf) => worker.postMessage(buf, [buf]), reject)
  })
}
