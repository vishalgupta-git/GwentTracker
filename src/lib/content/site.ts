// Single source for page copy that both the app and the static HTML use.
// vite.config.ts injects this into index.html at build time (meta tags,
// JSON-LD, and a no-JS fallback) so search engines see real content.

export const SITE_URL = 'https://vishalgupta-git.github.io/GwentTracker/'
export const SITE_TITLE = 'Witcher 3 Gwent Card Tracker – Find Your Missing Gwent Cards'
export const SITE_DESCRIPTION =
  "Upload your Witcher 3 save and instantly see every Gwent card you're missing, where to buy or win it, and which cards are missable. Free, private, runs in your browser."

/** Required wording from CD PROJEKT RED's Fan Content Guidelines. */
export const FAN_DISCLAIMER = 'This is an unofficial fan work and is not approved/endorsed by CD PROJEKT RED.'

export const STEPS = [
  {
    title: 'Find your save',
    text: 'On PC, open Documents › The Witcher 3 › gamesaves and pick your latest .sav file.',
  },
  {
    title: 'Drop it in',
    text: 'The save is read right here in your browser in under a second. Nothing is uploaded.',
  },
  {
    title: 'Collect them all',
    text: 'See every missing card, where to buy or win it, and which ones you can still lose.',
  },
]

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'Where are my Witcher 3 save files?',
    a: 'On Windows they are in Documents\\The Witcher 3\\gamesaves. With Steam on Linux or Steam Deck (Proton) look in steamapps/compatdata/292030/pfx/drive_c/users/steamuser/Documents/The Witcher 3/gamesaves. Any .sav works; the newest one gives the most up-to-date result.',
  },
  {
    q: 'Is my save file uploaded anywhere?',
    a: "No. The save is read entirely in your browser. There is no server, and the file never leaves your computer. Only your card counts are remembered in this browser so you can come back later.",
  },
  {
    q: 'Does it work with the next-gen (4.0) update and the DLCs?',
    a: 'Yes. It reads both classic and current-gen PC saves. Hearts of Stone and Blood and Wine cards can be switched on separately.',
  },
  {
    q: 'Can I use a PlayStation, Xbox or Switch save?',
    a: "Console saves can't be copied off the console as regular files, so they aren't supported. You can still browse every card and its location with the sample collection.",
  },
  {
    q: 'What is a missable Gwent card?',
    a: 'Some cards can only be won during a specific quest or before a certain point in the story, for example the High Stakes tournament in Novigrad. If you move on without them they are gone for that playthrough. The tracker flags these so you can grab them in time.',
  },
  {
    q: 'How many Gwent cards are there in The Witcher 3?',
    a: 'The base game has 199 card copies across 143 unique cards. Hearts of Stone and Blood and Wine add more, including the full Skellige deck.',
  },
]
