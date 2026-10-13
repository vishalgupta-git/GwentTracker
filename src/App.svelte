<script lang="ts">
  import CardDetail from '$lib/components/CardDetail.svelte'
  import CardList from '$lib/components/CardList.svelte'
  import MissableList from '$lib/components/MissableList.svelte'
  import UploadZone from '$lib/components/UploadZone.svelte'
  import { Button } from '$lib/components/ui/button'
  import * as Card from '$lib/components/ui/card'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { Progress } from '$lib/components/ui/progress'
  import { Switch } from '$lib/components/ui/switch'
  import * as Tabs from '$lib/components/ui/tabs'
  import { catalog } from '$lib/catalog'
  import { diff, parseSaveJson } from '$lib/diff'
  import { clearMarks, marks } from '$lib/marks.svelte'
  import { readSave } from '$lib/readSave'
  import { isSaveFile } from '$lib/save'
  import type { ReferenceCard, SaveCards } from '$lib/types'
  import LayoutGrid from '@lucide/svelte/icons/layout-grid'
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
    const { default: text } = await import('../a.txt?raw')
    load(text, 'sample collection')
  }

  function selectCard(card: ReferenceCard) {
    selectedKey = result?.groups.find((g) => g.cards.some((c) => c.index === card.index))?.key ?? null
  }

  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
</script>

<div class="mx-auto max-w-4xl px-4 py-10 sm:py-14">
  <header class="mb-8 space-y-2">
    <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Gwent Tracker</h1>
    <p class="text-muted-foreground max-w-2xl">
      See which Witcher 3 Gwent cards you're still missing, where to find them, and which ones you can lose for good.
    </p>
  </header>

  {#if error}
    <div role="alert" class="border-destructive/40 bg-destructive/5 text-destructive mb-4 rounded-lg border p-3 text-sm">
      {error}
    </div>
  {/if}

  {#if !result}
    <UploadZone {onfile} {onsample} {loading} />
  {:else}
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-muted-foreground text-sm">
          Showing <span class="text-foreground font-medium">{fileName}</span>
        </p>
        <div class="flex items-center gap-2">
          <Switch id="dlc" bind:checked={includeDlc} />
          <Label for="dlc">Include DLC (Hearts of Stone, Blood and Wine)</Label>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <Card.Root>
          <Card.Header>
            <Card.Description>Unique cards</Card.Description>
            <Card.Title class="text-2xl tabular-nums">
              {result.totals.namesOwned}<span class="text-muted-foreground text-base font-normal">
                / {result.totals.namesTotal}</span
              >
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <Progress value={pct(result.totals.namesOwned, result.totals.namesTotal)} />
          </Card.Content>
        </Card.Root>
        <Card.Root>
          <Card.Header>
            <Card.Description>Total copies</Card.Description>
            <Card.Title class="text-2xl tabular-nums">
              {result.totals.copiesOwned}<span class="text-muted-foreground text-base font-normal">
                / {result.totals.copiesTotal}</span
              >
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <Progress value={pct(result.totals.copiesOwned, result.totals.copiesTotal)} />
          </Card.Content>
        </Card.Root>
        <Card.Root class={result.missables.length ? 'border-destructive/40' : ''}>
          <Card.Header>
            <Card.Description>Missable quests at risk</Card.Description>
            <Card.Title class={['text-2xl tabular-nums', result.missables.length && 'text-destructive']}>
              {result.missables.length}
            </Card.Title>
          </Card.Header>
          <Card.Content class="text-muted-foreground text-xs">
            {result.missables.length ? 'Grab these before the cutoff quest.' : 'Nothing to worry about.'}
          </Card.Content>
        </Card.Root>
      </div>

      <Tabs.Root bind:value={tab}>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <Tabs.List>
            <Tabs.Trigger value="missing">Missing ({result.missing.length})</Tabs.Trigger>
            <Tabs.Trigger value="incomplete">Incomplete ({result.incomplete.length})</Tabs.Trigger>
            <Tabs.Trigger value="missable">Missable ({result.missables.length})</Tabs.Trigger>
            {#if result.marked.length}
              <Tabs.Trigger value="marked">Marked ({result.marked.length})</Tabs.Trigger>
            {/if}
          </Tabs.List>
          {#if tab !== 'missable'}
            <div class="flex w-full items-center gap-2 sm:w-auto">
              <div class="relative flex-1 sm:w-64">
                <Search class="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input class="pl-8" placeholder="Search name, deck, place…" bind:value={query} />
              </div>
              <div class="flex rounded-md border p-0.5" role="group" aria-label="View">
                {#each [['grid', LayoutGrid, 'Grid view'], ['list', List, 'List view']] as const as [v, Icon, label] (v)}
                  <button
                    type="button"
                    aria-label={label}
                    aria-pressed={view === v}
                    class={['rounded p-1.5', view === v ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground']}
                    onclick={() => (view = v)}
                  >
                    <Icon class="size-4" />
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>
        <Tabs.Content value="missing" class="mt-4">
          <CardList
            groups={result.missing}
            {query}
            {view}
            empty="You own at least one copy of every card in this view."
            onselect={(g) => (selectedKey = g.key)}
          />
        </Tabs.Content>
        <Tabs.Content value="incomplete" class="mt-4">
          <CardList
            groups={result.incomplete}
            {query}
            {view}
            showProgress
            empty="Every card you own is at full copies."
            onselect={(g) => (selectedKey = g.key)}
          />
        </Tabs.Content>
        <Tabs.Content value="missable" class="mt-4">
          <MissableList items={result.missables} onselect={selectCard} />
        </Tabs.Content>
        <Tabs.Content value="marked" class="mt-4 space-y-4">
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
        <details class="text-muted-foreground text-sm">
          <summary class="cursor-pointer">
            {result.unknownInSave.length} card{result.unknownInSave.length === 1 ? '' : 's'} in your save aren't in our catalog
          </summary>
          <ul class="mt-2 space-y-0.5 pl-4 font-mono text-xs">
            {#each result.unknownInSave as u (u.index)}
              <li>#{u.index} — {u.raw.name || 'unnamed'} ×{u.raw.count}</li>
            {/each}
          </ul>
        </details>
      {/if}

      <UploadZone compact {onfile} {onsample} {loading} />
    </div>
  {/if}

  <footer class="text-muted-foreground mt-16 space-y-1 border-t pt-6 text-xs">
    <p>
      Card data from <a class="underline" href="https://github.com/rfvgyhn/gwent-tracker">rfvgyhn/gwent-tracker</a>, save
      parsing ported from <a class="underline" href="https://github.com/rfvgyhn/W3SavegameEditor">W3SavegameEditor</a> (both
      MIT). Card images from the <a class="underline" href="https://witcher.fandom.com/">Witcher Wiki</a>.
      Source on <a class="underline" href="https://github.com/vishalgupta-git/GwentTracker">GitHub</a>.
    </p>
    <p>
      The Witcher 3: Wild Hunt, Gwent and all card artwork are property of CD Projekt Red. Unaffiliated,
      non-commercial fan project.
    </p>
  </footer>
</div>

<CardDetail group={selected} onclose={() => (selectedKey = null)} />
