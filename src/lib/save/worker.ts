// Parses a .sav off the main thread so large saves don't freeze the page.
import { parseSave, SaveParseError } from './parse'

self.onmessage = (e: MessageEvent<ArrayBuffer>) => {
  try {
    self.postMessage({ ok: true, cards: parseSave(new Uint8Array(e.data)) })
  } catch (err) {
    const message =
      err instanceof SaveParseError ? err.message : "Couldn't read this save file. It may be corrupt or from an unsupported version."
    self.postMessage({ ok: false, error: message })
  }
}
