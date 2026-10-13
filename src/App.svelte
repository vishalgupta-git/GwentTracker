<script lang="ts">
  import CardDetail from '$lib/components/CardDetail.svelte'
  import CardList from '$lib/components/CardList.svelte'
  import MissableList from '$lib/components/MissableList.svelte'
  import UploadZone from '$lib/components/UploadZone.svelte'
  import FactionProgress from '$lib/components/FactionProgress.svelte'
  import Ornament from '$lib/components/Ornament.svelte'
  import StatRing from '$lib/components/StatRing.svelte'
  import ThemeToggle from '$lib/components/ThemeToggle.svelte'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { Switch } from '$lib/components/ui/switch'
  import * as Tabs from '$lib/components/ui/tabs'
  import { catalog } from '$lib/collection/catalog'
  import { diff, parseSaveJson } from '$lib/collection/diff'
  import { clearMarks, marks } from '$lib/collection/marks.svelte'
  import { readSave } from '$lib/save/read'
  import { isSaveFile } from '$lib/save/parse'
  import type { ReferenceCard, SaveCards } from '$lib/types'
  import FileUp from '@lucide/svelte/icons/file-up'
  import LayoutGrid from '@lucide/svelte/icons/layout-grid'
  import MapPinned from '@lucide/svelte/icons/map-pinned'
  import ShieldCheck from '@lucide/svelte/icons/shield-check'
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert'
  import X from '@lucide/svelte/icons/x'
  import List from '@lucide/svelte/icons/list'
  import Search from '@lucide/svelte/icons/search'

  let owned = $state<SaveCards | null>(null)
  let fileName = $state('')
  let error = $state('')
  let loading = $state(false)
  let includeDlc = $state(false)
  let query = $state('')
  let tab = $state('missing')
  let selectedKey = $state<string | null>(null)
  let view = $state<'grid' | 'list'>(readView())

  function readView(): 'grid' | 'list' {
    try {
      return localStorage.getItem('view') === 'list' ? 'list' : 'grid'
    } catch {
      return 'grid'
    }
  }
  $effect(() => {
    try {
      localStorage.setItem('view', view)
    } catch {}
  })

  const result = $derived(owned ? diff(catalog, owned, includeDlc, marks) : null)
  const selected = $derived(result?.groups.find((g) => g.key === selectedKey) ?? null)
  $effect(() => {
    if (tab === 'marked' && result && result.marked.length === 0) tab = 'missing'
  })

  function load(text: string, name: string) {
    try {
      owned = parseSaveJson(text)
      fileName = name
      error = ''
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
      owned = await readSave(file)
      fileName = file.name
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    } finally {
      loading = false
    }
  }

  async function onsample() {
    const { default: text } = await import('../samples/sample-collection.json?raw')
    load(text, 'sample collection')
  }

  function selectCard(card: ReferenceCard) {
    selectedKey = result?.groups.find((g) => g.cards.some((c) => c.index === card.index))?.key ?? null
  }

  function reset() {
    owned = null
    fileName = ''
    error = ''
    query = ''
    tab = 'missing'
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
    <button type="button" class="group flex items-center gap-2.5" onclick={reset} aria-label="Gwent Tracker home">
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

    {#if !result}
      <section class="mx-auto max-w-3xl pt-6 text-center sm:pt-12">
        <p class="text-gold mb-3 text-xs font-semibold tracking-[0.3em] uppercase">The Witcher 3 · Wild Hunt</p>
        <h1 class="font-display text-gold-gradient text-4xl leading-tight font-bold sm:text-6xl">
          Complete your<br />Gwent collection
        </h1>
        <p class="text-muted-foreground mx-auto mt-5 max-w-xl text-base sm:text-lg">
          Drop in your save and see every card you're missing, where to win or buy it, and which ones you're about to
          lose for good.
        </p>
        <Ornament class="mx-auto my-8 max-w-xs" />
        <UploadZone {onfile} {onsample} {loading} />
      </section>

      <section class="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
        {#each FEATURES as f (f.title)}
          <div class="panel p-5">
            <div class="bg-gold/15 text-gold mb-3 grid size-10 place-items-center rounded-lg">
              <f.icon class="size-5" />
            </div>
            <h2 class="font-display font-semibold">{f.title}</h2>
            <p class="text-muted-foreground mt-1 text-sm">{f.text}</p>
          </div>
        {/each}
      </section>
    {:else}
      <section class="panel overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
          <div class="min-w-0">
            <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Your collection</p>
            <h1 class="truncate text-lg font-semibold sm:text-xl" title={fileName}>{fileName}</h1>
          </div>
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-2">
              <Switch id="dlc" bind:checked={includeDlc} />
              <Label for="dlc" class="text-sm">Include DLC</Label>
            </div>
            <Button variant="outline" size="sm" onclick={reset}><FileUp /> New save</Button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-x-4 gap-y-6 p-5 sm:p-6 md:grid-cols-[auto_auto_1fr] md:items-center md:gap-10">
          <StatRing value={result.totals.namesOwned} total={result.totals.namesTotal} label="Unique cards" />
          <StatRing value={result.totals.copiesOwned} total={result.totals.copiesTotal} label="Total copies" />
          <button
            type="button"
            onclick={() => (tab = 'missable')}
            class={[
              'col-span-2 flex items-center gap-3 rounded-xl border p-4 text-left transition-colors md:col-span-1',
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
          class="bg-background/80 sticky top-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6"
        >
          <Tabs.List variant="line" class="flex-wrap">
            <Tabs.Trigger value="missing">Missing <span class="tab-count">{result.missing.length}</span></Tabs.Trigger>
            <Tabs.Trigger value="incomplete"
              >Incomplete <span class="tab-count">{result.incomplete.length}</span></Tabs.Trigger
            >
            <Tabs.Trigger value="missable">Missable <span class="tab-count">{result.missables.length}</span></Tabs.Trigger>
            {#if result.marked.length}
              <Tabs.Trigger value="marked">Marked <span class="tab-count">{result.marked.length}</span></Tabs.Trigger>
            {/if}
          </Tabs.List>
          {#if tab !== 'missable'}
            <div class="flex w-full items-center gap-2 sm:w-auto">
              <div class="relative flex-1 sm:w-64">
                <Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input class="bg-card/70 rounded-full pl-9" placeholder="Search name, deck, place…" bind:value={query} />
              </div>
              <div class="bg-card/70 flex rounded-full border p-0.5" role="group" aria-label="View">
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

        <Tabs.Content value="missing" class="mt-6">
          <CardList
            groups={result.missing}
            {query}
            {view}
            empty="You own at least one copy of every card in this view."
            onselect={(g) => (selectedKey = g.key)}
          />
        </Tabs.Content>
        <Tabs.Content value="incomplete" class="mt-6">
          <CardList
            groups={result.incomplete}
            {query}
            {view}
            showProgress
            empty="Every card you own is at full copies."
            onselect={(g) => (selectedKey = g.key)}
          />
        </Tabs.Content>
        <Tabs.Content value="missable" class="mt-6">
          <MissableList items={result.missables} onselect={selectCard} />
        </Tabs.Content>
        <Tabs.Content value="marked" class="mt-6 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-muted-foreground text-sm">
              Cards you marked complete yourself. They count as collected; marks are saved in this browser.
            </p>
            <Button variant="outline" size="sm" onclick={clearMarks}>Clear all marks</Button>
          </div>
          <CardList
            groups={result.marked}
            {query}
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
      <p>
        The Witcher 3: Wild Hunt, Gwent and all card artwork are property of CD Projekt Red. Unaffiliated,
        non-commercial fan project.
      </p>
    </div>
  </footer>
</div>

<CardDetail group={selected} onclose={() => (selectedKey = null)} />
