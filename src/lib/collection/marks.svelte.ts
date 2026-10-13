import { SvelteSet } from 'svelte/reactivity'

// Cards the user marked complete by hand (group keys, see groupKey()).
// Kept in this browser only; storage may be unavailable (private mode), in
// which case marks simply last for the session.
const STORAGE_KEY = 'gwent-tracker:marked'

function read(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((k) => typeof k === 'string') : []
  } catch {
    return []
  }
}

export const marks = new SvelteSet<string>(read())

export function toggleMark(key: string) {
  if (marks.has(key)) marks.delete(key)
  else marks.add(key)
  save()
}

export function clearMarks() {
  marks.clear()
  save()
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...marks]))
  } catch {}
}
