import type { SaveCards } from '../types'

// The last loaded collection, so reopening the page shows it again.
// Only card counts are stored (a few KB), never the save file itself.
const KEY = 'gwent-tracker:last-save'

export interface LastSave {
  fileName: string
  owned: SaveCards
  savedAt: number
}

export function loadLastSave(): LastSave | null {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (data && typeof data.fileName === 'string' && data.owned && typeof data.owned === 'object') return data
  } catch {}
  return null
}

export function storeLastSave(fileName: string, owned: SaveCards) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ fileName, owned, savedAt: Date.now() } satisfies LastSave))
  } catch {}
}

export function clearLastSave() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}
