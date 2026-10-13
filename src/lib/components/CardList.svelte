<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { describeLocation } from '$lib/diff'
  import { DECK_ORDER, deckColor, SOURCE_LABEL } from '$lib/display'
  import type { CardGroup } from '$lib/types'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert'

  let {
    groups,
    query = '',
    showProgress = false,
    empty,
    onselect,
  }: {
    groups: CardGroup[]
    query?: string
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
</script>

{#if filtered.length === 0}
  <p class="text-muted-foreground py-10 text-center text-sm">{query ? 'No cards match your search.' : empty}</p>
{:else}
  <div class="space-y-6">
    {#each byDeck as [deck, items] (deck)}
      <section>
        <h3 class="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
          <span class={['size-2 rounded-full', deckColor(deck)]}></span>
          {deck}
          <span class="font-normal">· {items.length}</span>
        </h3>
        <ul class="divide-border bg-card divide-y overflow-hidden rounded-lg border">
          {#each items as g (g.key)}
            <li>
              <button
                type="button"
                class="hover:bg-muted/60 focus-visible:bg-muted/60 flex w-full items-center gap-3 px-4 py-3 text-left outline-none"
                onclick={() => onselect(g)}
              >
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="font-medium">{g.name}</span>
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
                <span class="text-muted-foreground shrink-0 text-sm tabular-nums">
                  {#if showProgress}{g.have}/{g.total}{:else if g.total > 1}×{g.total}{/if}
                </span>
                <ChevronRight class="text-muted-foreground size-4 shrink-0" />
              </button>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>
{/if}
