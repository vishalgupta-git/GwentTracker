<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import * as Dialog from '$lib/components/ui/dialog'
  import { catalog } from '$lib/collection/catalog'
  import { cardArt, deckColor, SOURCE_LABEL } from '$lib/display'
  import { marks, toggleMark } from '$lib/collection/marks.svelte'
  import type { CardGroup } from '$lib/types'
  import Check from '@lucide/svelte/icons/check'
  import MapPin from '@lucide/svelte/icons/map-pin'
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert'

  let { group, onclose }: { group: CardGroup | null; onclose: () => void } = $props()

  const missables = $derived(
    group ? catalog.missables.filter((m) => group!.cards.some((c) => m.cardIds.includes(c.index))) : [],
  )
</script>

<Dialog.Root
  open={group !== null}
  onOpenChange={(open) => {
    if (!open) onclose()
  }}
>
  <Dialog.Content class="max-h-[85vh] overflow-y-auto sm:max-w-lg">
    {#if group}
      <Dialog.Header>
        <Dialog.Title>{group.name}</Dialog.Title>
        <Dialog.Description class="flex flex-wrap items-center gap-1.5">
          <span class={['size-2 rounded-full', deckColor(group.deck)]}></span>
          {group.deck} · {group.type} · {SOURCE_LABEL[group.source]}
        </Dialog.Description>
      </Dialog.Header>

      <div class="flex gap-4">
        <img
          src={cardArt(group.cards[0].index)}
          alt={group.name}
          class="aspect-[280/527] w-28 shrink-0 object-contain drop-shadow-md sm:w-36"
        />
        <div class="space-y-3">
          {#if group.flavor}
            <p class="text-muted-foreground border-l-2 pl-3 text-sm italic">{group.flavor}</p>
          {/if}
          {#if marks.has(group.key)}
            <p class="text-sm text-emerald-700 dark:text-emerald-400">You marked this card as complete.</p>
          {:else}
            <div class="flex items-center gap-2 text-sm">
              <span class="text-muted-foreground">You have</span>
              <Badge variant={group.have === group.total ? 'secondary' : 'outline'} class="tabular-nums">
                {group.have} / {group.total}
              </Badge>
            </div>
          {/if}
          <Button
            variant={marks.has(group.key) ? 'outline' : 'default'}
            size="sm"
            onclick={() => toggleMark(group!.key)}
          >
            {#if marks.has(group.key)}Unmark{:else}<Check /> Mark as complete{/if}
          </Button>
        </div>
      </div>

      {#each missables as m (m.questName)}
        <div class="border-destructive/30 bg-destructive/5 space-y-1.5 rounded-lg border p-3 text-sm">
          <p class="text-destructive flex items-center gap-1.5 font-medium">
            <TriangleAlert class="size-4" /> Missable — {m.questName} ({m.region})
          </p>
          {#if m.cutoff}
            <p>Lost after: <span class="font-medium">{m.cutoff}</span></p>
          {/if}
          {#each m.notes as note}
            <p class="text-muted-foreground">{note}</p>
          {/each}
          {#if m.details}
            <a class="text-primary underline underline-offset-4" href={m.details} target="_blank" rel="noreferrer"
              >Wiki notes</a
            >
          {/if}
        </div>
      {/each}

      <div class="space-y-2">
        <h4 class="text-sm font-medium">Where to find it</h4>
        {#if group.locations.length === 0}
          <p class="text-muted-foreground text-sm">No known location.</p>
        {:else}
          <ul class="space-y-2">
            {#each group.locations as l}
              <li class="bg-muted/50 flex gap-2.5 rounded-md p-2.5 text-sm">
                <MapPin class="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <p class="font-medium">{l.type}{l.npc ? `: ${l.npc}` : ''}{l.quest ? `: ${l.quest}` : ''}</p>
                  <p class="text-muted-foreground">
                    {[l.area, l.territory, l.region].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
