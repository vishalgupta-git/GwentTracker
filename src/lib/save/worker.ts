// Parses a .sav off the main thread so large saves don't freeze the page.
import { parseSaveData, SaveParseError } from './parse'

self.onmessage = (e: MessageEvent<{ buffer: ArrayBuffer; factPrefixes: string[] }>) => {
  try {
    self.postMessage({ ok: true, save: parseSaveData(new Uint8Array(e.data.buffer), e.data.factPrefixes) })
  } catch (err) {
    const message =
      err instanceof SaveParseError ? err.message : "Couldn't read this save file. It may be corrupt or from an unsupported version."
    self.postMessage({ ok: false, error: message })
  }
}
