<script lang="ts">
  import { DECK_ORDER, deckColor } from '$lib/display'
  import type { CardGroup } from '$lib/types'

  let { groups }: { groups: CardGroup[] } = $props()

  const decks = $derived.by(() => {
    const by = new Map<string, { owned: number; total: number }>()
    for (const g of groups) {
      const d = by.get(g.deck) ?? { owned: 0, total: 0 }
      d.total++
      if (g.have > 0) d.owned++
      by.set(g.deck, d)
    }
    const order = (d: string) => DECK_ORDER.indexOf(d) + 1 || 99
    return [...by].sort(([a], [b]) => order(a) - order(b))
  })
</script>

<ul class="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
  {#each decks as [deck, d] (deck)}
    <li>
      <div class="mb-1 flex items-baseline justify-between gap-2 text-sm">
        <span class="flex items-center gap-2 font-medium">
          <span class={['size-2.5 rounded-full ring-2 ring-black/10', deckColor(deck)]}></span>{deck}
        </span>
        <span class="text-muted-foreground text-xs tabular-nums">{d.owned}/{d.total}</span>
      </div>
      <div class="bg-muted h-1.5 overflow-hidden rounded-full">
        <div
          class={['h-full rounded-full transition-[width] duration-700', deckColor(deck)]}
          style:width="{d.total ? (d.owned / d.total) * 100 : 0}%"
        ></div>
      </div>
    </li>
  {/each}
</ul>
