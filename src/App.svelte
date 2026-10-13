<script lang="ts">
  import CardDetail from '$lib/components/CardDetail.svelte'
  import CardList from '$lib/components/CardList.svelte'
  import MissableList from '$lib/components/MissableList.svelte'
  import RoutePlan from '$lib/components/RoutePlan.svelte'
  import UploadZone from '$lib/components/UploadZone.svelte'
  import CardFan from '$lib/components/CardFan.svelte'
  import FactionProgress from '$lib/components/FactionProgress.svelte'
  import Faq from '$lib/components/Faq.svelte'
  import HowItWorks from '$lib/components/HowItWorks.svelte'
  import Ornament from '$lib/components/Ornament.svelte'
  import StatRing from '$lib/components/StatRing.svelte'
  import ThemeToggle from '$lib/components/ThemeToggle.svelte'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { Switch } from '$lib/components/ui/switch'
  import * as Tabs from '$lib/components/ui/tabs'
  import { catalog } from '$lib/collection/catalog'
  import { BASE_GAME, diff, parseSaveJson, type Scope } from '$lib/collection/diff'
  import { checklistText, routeText } from '$lib/collection/export'
  import { planRoute } from '$lib/collection/route'
  import {
    abilitiesOf,
    filterGroups,
    regionsOf,
    SOURCE_KIND_LABEL,
    type Filters,
    type SourceKind,
  } from '$lib/collection/filters'
  import { ABILITY } from '$lib/display'
  import { clearLastSave, loadLastSave, storeLastSave } from '$lib/collection/lastSave'
  import { clearMarks, marks } from '$lib/collection/marks.svelte'
  import { FAN_DISCLAIMER } from '$lib/content/site'
  import { readSave } from '$lib/save/read'
  import { isSaveFile } from '$lib/save/parse'
  import type { Ability, ReferenceCard, SaveCards } from '$lib/types'
  import Check from '@lucide/svelte/icons/check'
  import ChevronDown from '@lucide/svelte/icons/chevron-down'
  import ClipboardCopy from '@lucide/svelte/icons/clipboard-copy'
  import Download from '@lucide/svelte/icons/download'
  import FileUp from '@lucide/svelte/icons/file-up'
  import LayoutGrid from '@lucide/svelte/icons/layout-grid'
  import MapPinned from '@lucide/svelte/icons/map-pinned'
  import ShieldCheck from '@lucide/svelte/icons/shield-check'
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert'
  import Trophy from '@lucide/svelte/icons/trophy'
  import X from '@lucide/svelte/icons/x'
  import List from '@lucide/svelte/icons/list'
  import Search from '@lucide/svelte/icons/search'

  const last = loadLastSave()
  let owned = $state<SaveCards | null>(last?.owned ?? null)
  let fileName = $state(last?.fileName ?? '')
  let restoredAt = $state<number | null>(last?.savedAt ?? null)
  // Showing the home page while a collection stays loaded.
  let home = $state(false)
  let error = $state('')
  let loading = $state(false)
  let scope = $state<Scope>(readJson('gwent-tracker:scope', BASE_GAME))
  let query = $state('')
  let region = $state<string | null>(null)
  let kind = $state<SourceKind | null>(null)
  let ability = $state<Ability | null>(null)
  let achievementOnly = $state(false)
  let tab = $state('missing')
  let selectedKey = $state<string | null>(null)
  let view = $state<'grid' | 'list'>(readJson('view', 'grid'))
  let copied = $state(false)

  function readJson<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return fallback
      // 'view' was stored as a bare string before.
      return raw.startsWith('{') ? { ...fallback, ...JSON.parse(raw) } : (raw as T)
    } catch {
      return fallback
    }
  }
  $effect(() => {
    try {
      localStorage.setItem('view', view)
      localStorage.setItem('gwent-tracker:scope', JSON.stringify(scope))
    } catch {}
  })

  const result = $derived(owned ? diff(catalog, owned, scope, marks) : null)
  const selected = $derived(result?.groups.find((g) => g.key === selectedKey) ?? null)
  const regions = $derived(result ? regionsOf(result.groups) : [])
  const abilities = $derived(result ? abilitiesOf(result.groups) : [])
  const filters = $derived<Filters>({ query, region, kind, ability, achievement: achievementOnly })
  const isFiltered = $derived(!!(query.trim() || region || kind || ability || achievementOnly))
  const shown = $derived(
    result
      ? {
          missing: filterGroups(result.missing, filters),
          incomplete: filterGroups(result.incomplete, filters),
          all: filterGroups(result.groups, filters),
          marked: filterGroups(result.marked, filters),
        }
      : null,
  )
  const route = $derived(shown ? planRoute([...shown.missing, ...shown.incomplete]) : null)
  $effect(() => {
    if (tab === 'marked' && result && result.marked.length === 0) tab = 'missing'
  })
  $effect(() => {
    if (region && !regions.includes(region)) region = null
    if (ability && !abilities.includes(ability)) ability = null
  })

  function clearFilters() {
    query = ''
    region = null
    kind = null
    ability = null
    achievementOnly = false
  }

  function setCollection(cards: SaveCards, name: string) {
    owned = cards
    fileName = name
    restoredAt = null
    error = ''
    home = false
    storeLastSave(name, cards)
  }

  function goHome() {
    home = true
    error = ''
    window.scrollTo({ top: 0 })
  }

  function load(text: string, name: string) {
    try {
      setCollection(parseSaveJson(text), name)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  async function onfile(file: File) {
    if (file.size > 64_000_000) {
      error = 'That file is too large to be a Witcher 3 save.'
      return
    }
    error = ''
    const head = new Uint8Array(await file.slice(0, 8).arrayBuffer())
    if (!isSaveFile(head)) {
      if (file.name.toLowerCase().endsWith('.sav')) error = "That doesn't look like a Witcher 3 save file."
      else load(await file.text(), file.name)
      return
    }
    loading = true
    try {
      setCollection(await readSave(file), file.name)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    } finally {
      loading = false
    }
  }

  async function onsample() {
    const { default: text } = await import('../samples/sample-collection.json?raw')
    load(text, 'Sample collection')
  }

  function selectCard(card: ReferenceCard) {
    selectedKey = result?.groups.find((g) => g.cards.some((c) => c.index === card.index))?.key ?? null
  }

  function reset() {
    owned = null
    fileName = ''
    restoredAt = null
    error = ''
    home = false
    clearFilters()
    tab = 'missing'
    clearLastSave()
  }

  const TAB_TITLES: Record<string, string> = {
    missing: 'Missing Gwent cards',
    incomplete: 'Incomplete Gwent cards',
    all: 'All Gwent cards',
    marked: 'Gwent cards marked complete',
  }
  const checklist = () =>
    tab === 'route' && route ? routeText(route) : checklistText(TAB_TITLES[tab], shown?.[tab as keyof typeof shown] ?? [])

  async function copyChecklist() {
    try {
      await navigator.clipboard.writeText(checklist())
      copied = true
      setTimeout(() => (copied = false), 1800)
    } catch {
      downloadChecklist()
    }
  }

  function downloadChecklist() {
    const url = URL.createObjectURL(new Blob([checklist()], { type: 'text/plain' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `gwent-${tab}.txt` })
    a.click()
    URL.revokeObjectURL(url)
  }

  const timeAgo = (t: number) => {
    const mins = Math.round((Date.now() - t) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins} min ago`
    const hours = Math.round(mins / 60)
    if (hours < 24) return `${hours} h ago`
    return new Date(t).toLocaleDateString()
  }

  const FEATURES = [
    { icon: ShieldCheck, title: 'Private by design', text: 'Your save is read in your browser. Nothing is uploaded.' },
    { icon: MapPinned, title: 'Where to find them', text: 'Merchants, players and quests for every missing card.' },
    { icon: TriangleAlert, title: 'Missable warnings', text: "Cards you'll lose for good if you move on too soon." },
  ]
</script>

<div class="app-backdrop"></div>

<div class="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 sm:px-6">
  <header class="flex items-center justify-between py-5">
    <button type="button" class="group flex items-center gap-2.5" onclick={goHome} aria-label="Gwent Tracker home">
      <img src="{import.meta.env.BASE_URL}favicon.svg" alt="" class="size-8 transition-transform group-hover:-rotate-6" />
      <span class="font-display text-lg font-semibold tracking-wide">Gwent Tracker</span>
    </button>
    <ThemeToggle />
  </header>

  <main class="flex-1 pb-16">
    {#if error}
      <div
        role="alert"
        class="border-destructive/40 bg-destructive/10 text-destructive mx-auto mb-6 flex max-w-2xl items-start gap-2 rounded-xl border p-3 text-sm"
      >
        <TriangleAlert class="mt-0.5 size-4 shrink-0" />
        <span class="flex-1">{error}</span>
        <button type="button" aria-label="Dismiss" onclick={() => (error = '')}><X class="size-4" /></button>
      </div>
    {/if}

    {#if !result || home}
      <section class="grid items-center gap-10 pt-4 sm:pt-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div class="order-2 text-center lg:order-1 lg:text-left">
          <p class="text-gold mb-3 text-xs font-semibold tracking-[0.3em] uppercase">The Witcher 3 · Gwent tracker</p>
          <h1 class="font-display text-gold-gradient text-4xl leading-tight font-bold sm:text-5xl xl:text-6xl">
            Complete your Gwent collection
          </h1>
          <p class="text-muted-foreground mx-auto mt-5 max-w-xl text-base sm:text-lg lg:mx-0">
            Drop in your Witcher 3 save and see every Gwent card you're missing, where to win or buy it, and which ones
            you're about to lose for good.
          </p>
          <Ornament class="mx-auto my-7 max-w-xs lg:mx-0" />
          {#if result}
            <div class="panel mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-3 text-sm lg:justify-between">
              <Button size="sm" onclick={() => (home = false)}>
                Continue with <span class="max-w-48 truncate">{fileName}</span>
              </Button>
              <button type="button" class="text-muted-foreground hover:text-foreground text-xs underline" onclick={reset}
                >Forget this save</button
              >
            </div>
          {/if}
          <UploadZone {onfile} {onsample} {loading} />
        </div>
        <div class="order-1 px-6 lg:order-2 lg:px-0">
          <CardFan />
        </div>
      </section>

      <div class="mt-20 space-y-20">
        <HowItWorks />

        <section aria-label="Features" class="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
          {#each FEATURES as f (f.title)}
            <div class="panel p-5">
              <div class="bg-gold/15 text-gold mb-3 grid size-10 place-items-center rounded-lg">
                <f.icon class="size-5" />
              </div>
              <h3 class="font-display font-semibold">{f.title}</h3>
              <p class="text-muted-foreground mt-1 text-sm">{f.text}</p>
            </div>
          {/each}
        </section>

        <Faq />
      </div>
    {:else}
      <section class="panel overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
          <div class="min-w-0">
            <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Your collection{#if restoredAt}<span class="normal-case tracking-normal">
                  · restored from your last visit ({timeAgo(restoredAt)})</span
                >{/if}
            </p>
            <h1 class="truncate text-lg font-semibold sm:text-xl" title={fileName}>{fileName}</h1>
          </div>
          <div class="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div class="flex items-center gap-2">
              <Switch id="hos" bind:checked={scope.hos} />
              <Label for="hos" class="text-sm">Hearts of Stone</Label>
            </div>
            <div class="flex items-center gap-2">
              <Switch id="bw" bind:checked={scope.bw} />
              <Label for="bw" class="text-sm">Blood and Wine</Label>
            </div>
            <Button variant="outline" size="sm" onclick={goHome}><FileUp /> New save</Button>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-x-4 gap-y-6 p-5 sm:p-6 lg:grid-cols-[auto_auto_auto_1fr] lg:items-center lg:gap-10">
          <StatRing value={result.totals.namesOwned} total={result.totals.namesTotal} label="Unique cards" />
          <StatRing value={result.totals.copiesOwned} total={result.totals.copiesTotal} label="Total copies" />
          <StatRing
            value={result.totals.achievementOwned}
            total={result.totals.achievementTotal}
            label="Collect 'Em All"
            sub="Achievement"
          />
          <button
            type="button"
            onclick={() => (tab = 'missable')}
            class={[
              'col-span-3 flex items-center gap-3 rounded-xl border p-4 text-left transition-colors lg:col-span-1',
              result.missables.length
                ? 'border-destructive/40 bg-destructive/10 hover:bg-destructive/15'
                : 'border-success/30 bg-success/10',
            ]}
          >
            {#if result.missables.length}
              <TriangleAlert class="text-destructive size-8 shrink-0" />
              <span>
                <span class="font-display text-destructive block text-lg font-semibold">
                  {result.missables.length} missable quest{result.missables.length === 1 ? '' : 's'} at risk
                </span>
                <span class="text-muted-foreground text-sm">Get these before the cutoff quest.</span>
              </span>
            {:else}
              <ShieldCheck class="text-success size-8 shrink-0" />
              <span>
                <span class="font-display text-success block text-lg font-semibold">No missable cards at risk</span>
                <span class="text-muted-foreground text-sm">Take your time.</span>
              </span>
            {/if}
          </button>
        </div>

        <div class="bg-surface-1/60 border-t px-5 py-5 sm:px-6">
          <FactionProgress groups={result.groups} />
        </div>
      </section>

      <Tabs.Root bind:value={tab} class="mt-8">
        <div
          class="bg-background/85 sticky top-0 z-20 -mx-4 space-y-3 border-b px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <Tabs.List variant="line" class="max-w-full justify-start overflow-x-auto [scrollbar-width:none]">
              <Tabs.Trigger value="missing">Missing <span class="tab-count">{result.missing.length}</span></Tabs.Trigger>
              <Tabs.Trigger value="incomplete"
                >Incomplete <span class="tab-count">{result.incomplete.length}</span></Tabs.Trigger
              >
              <Tabs.Trigger value="missable"
                >Missable <span class="tab-count">{result.missables.length}</span></Tabs.Trigger
              >
              <Tabs.Trigger value="route">Route <span class="tab-count">{route?.regions.length ?? 0}</span></Tabs.Trigger>
              <Tabs.Trigger value="all">All cards <span class="tab-count">{result.groups.length}</span></Tabs.Trigger>
              {#if result.marked.length}
                <Tabs.Trigger value="marked">Marked <span class="tab-count">{result.marked.length}</span></Tabs.Trigger>
              {/if}
            </Tabs.List>
            {#if tab !== 'missable'}
              <div class="flex w-full items-center gap-2 sm:w-auto">
                <div class="relative flex-1 sm:w-60">
                  <Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input class="bg-card/70 rounded-full pl-9" placeholder="Search name, place…" bind:value={query} />
                </div>
                <div class={['bg-card/70 flex rounded-full border p-0.5', tab === 'route' && 'hidden']} role="group" aria-label="View">
                  {#each [['grid', LayoutGrid, 'Grid view'], ['list', List, 'List view']] as const as [v, Icon, label] (v)}
                    <button
                      type="button"
                      aria-label={label}
                      aria-pressed={view === v}
                      class={[
                        'rounded-full p-1.5 transition-colors',
                        view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                      ]}
                      onclick={() => (view = v)}
                    >
                      <Icon class="size-4" />
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>

          {#if tab !== 'missable'}
            <div class="flex items-center gap-2">
              <div class="-mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">
                <button
                  type="button"
                  aria-pressed={achievementOnly}
                  title="Only cards that count toward the Collect 'Em All achievement"
                  class={['chip inline-flex items-center gap-1', achievementOnly && 'chip-active']}
                  onclick={() => (achievementOnly = !achievementOnly)}><Trophy class="size-3" /> Collect 'Em All</button
                >
                <span class="relative shrink-0">
                  <select
                    aria-label="Ability"
                    bind:value={ability}
                    class={[
                      'chip cursor-pointer appearance-none pr-6 [field-sizing:content]',
                      ability && 'chip-active',
                    ]}
                  >
                    <option value={null}>Any ability</option>
                    {#each abilities as a (a)}
                      <option value={a}>{ABILITY[a].label}</option>
                    {/each}
                  </select>
                  <ChevronDown
                    class={[
                      'pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2',
                      ability ? 'text-primary-foreground' : 'text-muted-foreground',
                    ]}
                  />
                </span>
                <span class="bg-border mx-1 w-px shrink-0"></span>
                {#each Object.entries(SOURCE_KIND_LABEL) as [k, label] (k)}
                  <button
                    type="button"
                    aria-pressed={kind === k}
                    class={['chip', kind === k && 'chip-active']}
                    onclick={() => (kind = kind === k ? null : (k as SourceKind))}>{label}</button
                  >
                {/each}
                <span class="bg-border mx-1 w-px shrink-0"></span>
                {#each regions as r (r)}
                  <button
                    type="button"
                    aria-pressed={region === r}
                    class={['chip', region === r && 'chip-active']}
                    onclick={() => (region = region === r ? null : r)}>{r}</button
                  >
                {/each}
              </div>
              <div class="flex shrink-0 items-center gap-1">
                {#if isFiltered}
                  <button
                    type="button"
                    class="text-muted-foreground hover:text-foreground px-1.5 text-xs underline"
                    onclick={clearFilters}>Clear</button
                  >
                {/if}
                <Button variant="ghost" size="icon-sm" title="Copy as checklist" aria-label="Copy as checklist" onclick={copyChecklist}>
                  {#if copied}<Check class="text-success" />{:else}<ClipboardCopy />{/if}
                </Button>
                <Button variant="ghost" size="icon-sm" title="Download as .txt" aria-label="Download as text file" onclick={downloadChecklist}>
                  <Download />
                </Button>
              </div>
            </div>
          {/if}
        </div>

        <Tabs.Content value="missing" class="mt-6">
          <CardList
            groups={shown!.missing}
            filtered={isFiltered}
            {view}
            empty="You own at least one copy of every card in this view."
            onselect={(g) => (selectedKey = g.key)}
          />
        </Tabs.Content>
        <Tabs.Content value="incomplete" class="mt-6">
          <CardList
            groups={shown!.incomplete}
            filtered={isFiltered}
            {view}
            showProgress
            empty="Every card you own is at full copies."
            onselect={(g) => (selectedKey = g.key)}
          />
        </Tabs.Content>
        <Tabs.Content value="missable" class="mt-6">
          <MissableList items={result.missables} onselect={selectCard} />
        </Tabs.Content>
        <Tabs.Content value="route" class="mt-6">
          <RoutePlan route={route!} onselect={(g) => (selectedKey = g.key)} />
        </Tabs.Content>
        <Tabs.Content value="all" class="mt-6">
          <CardList
            groups={shown!.all}
            filtered={isFiltered}
            {view}
            showProgress
            dimMissing
            empty="No cards."
            onselect={(g) => (selectedKey = g.key)}
          />
        </Tabs.Content>
        <Tabs.Content value="marked" class="mt-6 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-muted-foreground text-sm">
              Cards you marked complete yourself. They count as collected; marks are saved in this browser.
            </p>
            <Button variant="outline" size="sm" onclick={clearMarks}>Clear all marks</Button>
          </div>
          <CardList
            groups={shown!.marked}
            filtered={isFiltered}
            {view}
            empty="No cards marked."
            onselect={(g) => (selectedKey = g.key)}
          />
        </Tabs.Content>
      </Tabs.Root>

      {#if result.unknownInSave.length}
        <details class="text-muted-foreground mt-10 text-sm">
          <summary class="cursor-pointer">
            {result.unknownInSave.length} card{result.unknownInSave.length === 1 ? '' : 's'} in your save aren't in our catalog
          </summary>
          <ul class="mt-2 space-y-0.5 pl-4 font-mono text-xs">
            {#each result.unknownInSave as u (u.index)}
              <li>#{u.index} — {u.raw.name || 'Unknown card'} ×{u.raw.count}</li>
            {/each}
          </ul>
        </details>
      {/if}

      <div class="mt-10">
        <UploadZone compact {onfile} {onsample} {loading} />
      </div>
    {/if}
  </main>

  <footer class="text-muted-foreground border-t py-6 text-xs">
    <Ornament class="mx-auto mb-4 max-w-[10rem] opacity-60" />
    <div class="space-y-1 text-center">
      <p>
        Card data from <a class="hover:text-gold underline" href="https://github.com/rfvgyhn/gwent-tracker"
          >rfvgyhn/gwent-tracker</a
        >, save parsing ported from
        <a class="hover:text-gold underline" href="https://github.com/rfvgyhn/W3SavegameEditor">W3SavegameEditor</a>
        (both MIT). Card images from the
        <a class="hover:text-gold underline" href="https://witcher.fandom.com/">Witcher Wiki</a>.
      </p>
      <p>{FAN_DISCLAIMER}</p>
      <p>
        The Witcher 3: Wild Hunt, Gwent and all card artwork are property of CD PROJEKT RED. Free, non-commercial
        fan project · <a class="hover:text-gold underline" href="https://github.com/vishalgupta-git/GwentTracker"
          >Source on GitHub</a
        >
      </p>
    </div>
  </footer>
</div>

<CardDetail group={selected} onclose={() => (selectedKey = null)} />
