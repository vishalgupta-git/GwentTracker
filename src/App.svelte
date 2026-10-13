<script lang="ts">
  import CardDetail from '$lib/components/CardDetail.svelte'
  import CardList from '$lib/components/CardList.svelte'
  import MissableList from '$lib/components/MissableList.svelte'
  import UploadZone from '$lib/components/UploadZone.svelte'
  import * as Card from '$lib/components/ui/card'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { Progress } from '$lib/components/ui/progress'
  import { Switch } from '$lib/components/ui/switch'
  import * as Tabs from '$lib/components/ui/tabs'
  import { catalog } from '$lib/catalog'
  import { diff, parseSaveJson } from '$lib/diff'
  import type { CardGroup, ReferenceCard, SaveCards } from '$lib/types'
  import Search from '@lucide/svelte/icons/search'

  let owned = $state<SaveCards | null>(null)
  let fileName = $state('')
  let error = $state('')
  let includeDlc = $state(false)
  let query = $state('')
  let tab = $state('missing')
  let selected = $state<CardGroup | null>(null)

  const result = $derived(owned ? diff(catalog, owned, includeDlc) : null)

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
    if (file.size > 5_000_000) {
      error = 'That file is too large to be a gwentCards export.'
      return
    }
    load(await file.text(), file.name)
  }

  async function onsample() {
    const { default: text } = await import('../a.txt?raw')
    load(text, 'sample collection')
  }

  function selectCard(card: ReferenceCard) {
    selected = result?.groups.find((g) => g.cards.some((c) => c.index === card.index)) ?? null
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
    <UploadZone {onfile} {onsample} />
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
          </Tabs.List>
          {#if tab !== 'missable'}
            <div class="relative w-full sm:w-64">
              <Search class="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input class="pl-8" placeholder="Search name, deck, place…" bind:value={query} />
            </div>
          {/if}
        </div>
        <Tabs.Content value="missing" class="mt-4">
          <CardList
            groups={result.missing}
            {query}
            empty="You own at least one copy of every card in this view."
            onselect={(g) => (selected = g)}
          />
        </Tabs.Content>
        <Tabs.Content value="incomplete" class="mt-4">
          <CardList
            groups={result.incomplete}
            {query}
            showProgress
            empty="Every card you own is at full copies."
            onselect={(g) => (selected = g)}
          />
        </Tabs.Content>
        <Tabs.Content value="missable" class="mt-4">
          <MissableList items={result.missables} onselect={selectCard} />
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

      <UploadZone compact {onfile} {onsample} />
    </div>
  {/if}

  <footer class="text-muted-foreground mt-16 space-y-1 border-t pt-6 text-xs">
    <p>
      Card data from <a class="underline" href="https://github.com/rfvgyhn/gwent-tracker">rfvgyhn/gwent-tracker</a> (MIT).
      Source on <a class="underline" href="https://github.com/vishalgupta-git/GwentTracker">GitHub</a>.
    </p>
    <p>The Witcher 3: Wild Hunt and Gwent are property of CD Projekt Red. Unaffiliated fan project.</p>
  </footer>
</div>

<CardDetail bind:group={selected} />
