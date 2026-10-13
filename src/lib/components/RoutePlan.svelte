<script lang="ts">
  import { SOURCE_KIND_LABEL } from '$lib/collection/filters'
  import type { Route } from '$lib/collection/route'
  import { cardArt } from '$lib/display'
  import type { CardGroup } from '$lib/types'
  import Dices from '@lucide/svelte/icons/dices'
  import MapPin from '@lucide/svelte/icons/map-pin'
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert'

  let { route, onselect }: { route: Route; onselect: (g: CardGroup) => void } = $props()
</script>

{#snippet cardChip(g: CardGroup)}
  <button
    type="button"
    class="bg-card/80 hover:border-gold/60 flex items-center gap-2 rounded-lg border py-1 pr-2.5 pl-1 text-left text-sm transition-colors"
    onclick={() => onselect(g)}
  >
    <img src={cardArt(g.cards[0].index)} alt="" width="280" height="527" loading="lazy" class="aspect-[280/527] h-10 w-auto rounded-sm object-cover object-top" />
    <span class="leading-tight">
      {g.name}
      {#if g.total - g.have > 1}<span class="text-muted-foreground tabular-nums"> ×{g.total - g.have}</span>{/if}
    </span>
    {#if g.missable}<TriangleAlert class="text-destructive size-3.5 shrink-0" aria-label="Missable" />{/if}
  </button>
{/snippet}

{#if route.regions.length === 0 && route.random.length === 0}
  <p class="text-muted-foreground panel py-12 text-center text-sm">Nothing left to collect in this view.</p>
{:else}
  <p class="text-muted-foreground mb-5 text-sm">
    Cards you still need, grouped by where to get them. The places with the most cards come first. A card can show up
    in more than one place.
  </p>
  <div class="space-y-6">
    {#each route.regions as r (r.region)}
      <section class="panel overflow-hidden">
        <header class="bg-surface-1/60 flex items-baseline justify-between gap-3 border-b px-5 py-3">
          <h2 class="font-display text-lg font-semibold">{r.region}</h2>
          <span class="text-muted-foreground text-sm tabular-nums">{r.cardCount} card{r.cardCount === 1 ? '' : 's'}</span>
        </header>
        <ul class="divide-y">
          {#each r.stops as s (s.key)}
            <li class="grid gap-2 px-5 py-3.5 sm:grid-cols-[14rem_1fr] sm:gap-4">
              <div class="flex gap-2">
                <MapPin class="text-gold mt-0.5 size-4 shrink-0" />
                <div class="min-w-0">
                  <p class="font-medium">{s.who}</p>
                  {#if s.place}<p class="text-muted-foreground text-sm">{s.place}</p>{/if}
                  <p class="text-muted-foreground mt-0.5 text-xs tracking-wider uppercase">
                    {s.kinds.map((k) => SOURCE_KIND_LABEL[k]).join(' · ')}
                  </p>
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                {#each s.cards as g (g.key)}
                  {@render cardChip(g)}
                {/each}
              </div>
            </li>
          {/each}
        </ul>
      </section>
    {/each}

    {#if route.random.length}
      <section class="panel overflow-hidden">
        <header class="bg-surface-1/60 flex items-baseline justify-between gap-3 border-b px-5 py-3">
          <h2 class="font-display flex items-center gap-2 text-lg font-semibold">
            <Dices class="text-gold size-4" /> Random merchant rewards
          </h2>
          <span class="text-muted-foreground text-sm tabular-nums"
            >{route.random.length} card{route.random.length === 1 ? '' : 's'}</span
          >
        </header>
        <div class="space-y-3 px-5 py-4">
          <p class="text-muted-foreground text-sm">
            The first time you beat any merchant who plays Gwent, they give you one random card from a pool of 51. Cards
            never repeat, so beat every merchant you meet.
          </p>
          <div class="flex flex-wrap gap-2">
            {#each route.random as g (g.key)}
              {@render cardChip(g)}
            {/each}
          </div>
        </div>
      </section>
    {/if}
  </div>
{/if}
