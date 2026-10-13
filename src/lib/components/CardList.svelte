<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { describeLocation } from '$lib/collection/diff'
  import { cardArt, DECK_ORDER, deckColor, SOURCE_LABEL } from '$lib/display'
  import { toggleMark } from '$lib/collection/marks.svelte'
  import type { CardGroup } from '$lib/types'
  import Check from '@lucide/svelte/icons/check'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert'
  import Undo2 from '@lucide/svelte/icons/undo-2'

  let {
    groups,
    query = '',
    view = 'grid',
    showProgress = false,
    empty,
    onselect,
  }: {
    groups: CardGroup[]
    query?: string
    view?: 'grid' | 'list'
    showProgress?: boolean
    empty: string
    onselect: (g: CardGroup) => void
  } = $props()

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase()
    const matches = (g: CardGroup) =>
      !q ||
      [g.name, g.deck, g.type, ...g.locations.map(describeLocation)].some((s) => s.toLowerCase().includes(q))
    return groups.filter(matches)
  })

  // Missable first, then by deck, then name.
  const byDeck = $derived.by(() => {
    const sections = new Map<string, CardGroup[]>()
    const order = (d: string) => (DECK_ORDER.indexOf(d) + 1 || 99)
    const sorted = [...filtered].sort(
      (a, b) =>
        order(a.deck) - order(b.deck) || Number(b.missable) - Number(a.missable) || a.name.localeCompare(b.name),
    )
    for (const g of sorted) sections.set(g.deck, [...(sections.get(g.deck) ?? []), g])
    return [...sections]
  })

  const count = (g: CardGroup) => (showProgress ? `${g.have}/${g.total}` : g.total > 1 ? `×${g.total}` : '')
  const markLabel = (g: CardGroup) => (g.marked ? `Unmark ${g.name}` : `Mark ${g.name} as complete`)
</script>

{#if filtered.length === 0}
  <p class="text-muted-foreground py-10 text-center text-sm">{query ? 'No cards match your search.' : empty}</p>
{:else}
  <div class="space-y-10">
    {#each byDeck as [deck, items] (deck)}
      <section>
        <h3 class="mb-4 flex items-center gap-3">
          <span class={['h-5 w-1 rounded-full', deckColor(deck)]}></span>
          <span class="font-display text-lg font-semibold tracking-wide">{deck}</span>
          <span class="text-muted-foreground bg-muted rounded-full px-2 text-xs tabular-nums">{items.length}</span>
          <span class="bg-border h-px flex-1"></span>
        </h3>

        {#if view === 'grid'}
          <ul class="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-6">
            {#each items as g (g.key)}
              <li class="group relative">
                <button
                  type="button"
                  class="focus-visible:ring-ring block w-full rounded-lg outline-none focus-visible:ring-2"
                  onclick={() => onselect(g)}
                >
                  <img
                    src={cardArt(g.cards[0].index)}
                    alt={g.name}
                    loading="lazy"
                    decoding="async"
                    class="card-glow aspect-[280/527] w-full object-contain"
                  />
                </button>
                <button
                  type="button"
                  aria-label={markLabel(g)}
                  title={g.marked ? 'Unmark' : 'Mark as complete'}
                  class={[
                    'absolute top-2 right-2 grid size-8 place-items-center rounded-full border shadow-lg backdrop-blur transition-all',
                    g.marked
                      ? 'border-success bg-success text-white'
                      : 'bg-background/85 text-foreground hover:border-success hover:bg-success hover:text-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100',
                  ]}
                  onclick={() => toggleMark(g.key)}
                >
                  {#if g.marked}<Undo2 class="size-3.5" />{:else}<Check class="size-4" />{/if}
                </button>
                {#if g.missable || count(g) || g.source !== 'BaseGame'}
                  <div class="mt-2 flex flex-wrap items-center justify-center gap-1">
                    {#if g.missable}
                      <Badge variant="destructive"><TriangleAlert /> Missable</Badge>
                    {/if}
                    {#if g.source !== 'BaseGame'}
                      <Badge variant="outline">{g.source === 'HeartsOfStone' ? 'HoS' : 'B&W'}</Badge>
                    {/if}
                    {#if count(g)}
                      <Badge variant="secondary" class="tabular-nums">{count(g)}</Badge>
                    {/if}
                  </div>
                {/if}
              </li>
            {/each}
          </ul>
        {:else}
          <ul class="panel divide-border divide-y overflow-hidden">
            {#each items as g (g.key)}
              <li class="flex items-center">
                <button
                  type="button"
                  class="hover:bg-gold/5 focus-visible:bg-gold/5 flex min-w-0 flex-1 items-center gap-4 px-4 py-3 text-left outline-none"
                  onclick={() => onselect(g)}
                >
                  <img
                    src={cardArt(g.cards[0].index)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    class="h-20 w-[42px] shrink-0 object-contain drop-shadow"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span class="font-display font-semibold">{g.name}</span>
                      {#if g.missable}
                        <Badge variant="destructive"><TriangleAlert /> Missable</Badge>
                      {/if}
                      {#if g.type === 'Hero' || g.type === 'Leader'}
                        <Badge variant="secondary">{g.type}</Badge>
                      {/if}
                      {#if g.source !== 'BaseGame'}
                        <Badge variant="outline">{SOURCE_LABEL[g.source]}</Badge>
                      {/if}
                    </div>
                    {#if g.locations.length}
                      <p class="text-muted-foreground mt-0.5 truncate text-sm">
                        {describeLocation(g.locations[0])}{g.locations.length > 1
                          ? ` (+${g.locations.length - 1} more)`
                          : ''}
                      </p>
                    {/if}
                  </div>
                  <span class="text-muted-foreground shrink-0 text-sm tabular-nums">{count(g)}</span>
                  <ChevronRight class="text-muted-foreground size-4 shrink-0" />
                </button>
                <button
                  type="button"
                  aria-label={markLabel(g)}
                  title={g.marked ? 'Unmark' : 'Mark as complete'}
                  class={[
                    'mx-2 grid size-8 shrink-0 place-items-center rounded-full border',
                    g.marked
                      ? 'border-success bg-success text-white'
                      : 'text-muted-foreground hover:border-success hover:bg-success hover:text-white',
                  ]}
                  onclick={() => toggleMark(g.key)}
                >
                  {#if g.marked}<Undo2 class="size-3.5" />{:else}<Check class="size-4" />{/if}
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    {/each}
  </div>
{/if}
