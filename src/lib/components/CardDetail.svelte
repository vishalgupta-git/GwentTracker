<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import * as Dialog from '$lib/components/ui/dialog'
  import { catalog } from '$lib/collection/catalog'
  import { ABILITY, cardArt, deckColor, ROW_LABEL, SOURCE_LABEL } from '$lib/display'
  import { marks, toggleMark } from '$lib/collection/marks.svelte'
  import type { CardGroup } from '$lib/types'
  import Check from '@lucide/svelte/icons/check'
  import MapPin from '@lucide/svelte/icons/map-pin'
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert'
  import Trophy from '@lucide/svelte/icons/trophy'

  let { group, onclose }: { group: CardGroup | null; onclose: () => void } = $props()

  const card = $derived(group?.cards[0])
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
  <Dialog.Content class="max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
    {#if group}
      <div class="grid gap-0 sm:grid-cols-[13rem_1fr]">
        <div
          class="from-gold/20 relative flex items-center justify-center bg-gradient-to-b to-transparent p-6 sm:rounded-l-xl"
        >
          <img
            src={cardArt(group.cards[0].index)}
            alt={group.name}
            class="aspect-[280/527] w-36 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)] sm:w-full"
          />
        </div>

        <div class="space-y-5 p-6 sm:pl-2">
          <Dialog.Header class="space-y-2 text-left">
            <Dialog.Title class="font-display text-2xl leading-tight">{group.name}</Dialog.Title>
            <Dialog.Description class="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" class="gap-1.5">
                <span class={['size-2 rounded-full', deckColor(group.deck)]}></span>{group.deck}
              </Badge>
              <Badge variant="outline">{group.type}</Badge>
              <Badge variant="outline">{SOURCE_LABEL[group.source]}</Badge>
              {#if group.achievement}
                <Badge variant="outline" class="border-gold/50 text-gold gap-1.5"><Trophy /> Collect 'Em All</Badge>
              {/if}
            </Dialog.Description>
          </Dialog.Header>

          {#if group.flavor}
            <blockquote class="border-gold/60 text-muted-foreground border-l-2 pl-3 text-sm italic">
              {group.flavor}
            </blockquote>
          {/if}

          {#if card && (card.strength != null || card.rows.length || card.abilities.length)}
            <div class="space-y-2 text-sm">
              {#if card.strength != null || card.rows.length}
                <dl class="flex flex-wrap gap-x-5 gap-y-1">
                  {#if card.strength != null}
                    <div class="flex gap-1.5">
                      <dt class="text-muted-foreground">Strength</dt>
                      <dd class="font-semibold tabular-nums">{card.strength}</dd>
                    </div>
                  {/if}
                  {#if card.rows.length}
                    <div class="flex gap-1.5">
                      <dt class="text-muted-foreground">{card.strength != null ? 'Row' : 'Affects'}</dt>
                      <dd class="font-semibold">{card.rows.map((r) => ROW_LABEL[r]).join(card.strength != null ? ' or ' : ' and ')}</dd>
                    </div>
                  {/if}
                </dl>
              {/if}
              {#each card.abilities as a (a)}
                <p><span class="font-semibold">{ABILITY[a].label}:</span> <span class="text-muted-foreground">{ABILITY[a].text}</span></p>
              {/each}
            </div>
          {/if}

          <div class="flex flex-wrap items-center gap-3">
            {#if marks.has(group.key)}
              <span class="text-success text-sm font-medium">Marked as complete</span>
            {:else}
              <span class="text-sm">
                <span class="text-muted-foreground">You have</span>
                <span class="font-display ml-1 text-lg font-semibold tabular-nums">{group.have}/{group.total}</span>
              </span>
            {/if}
            <Button
              variant={marks.has(group.key) ? 'outline' : 'default'}
              size="sm"
              class="ml-auto"
              onclick={() => toggleMark(group!.key)}
            >
              {#if marks.has(group.key)}Unmark{:else}<Check /> Mark as complete{/if}
            </Button>
          </div>

          {#each missables as m (m.questName)}
            <div class="border-destructive/30 bg-destructive/10 space-y-1.5 rounded-xl border p-3.5 text-sm">
              <p class="text-destructive flex items-center gap-1.5 font-semibold">
                <TriangleAlert class="size-4" /> Missable · {m.questName} ({m.region})
              </p>
              {#if m.cutoff}
                <p>Lost after <span class="font-semibold">{m.cutoff}</span></p>
              {/if}
              {#each m.notes as note}
                <p class="text-muted-foreground">{note}</p>
              {/each}
              {#if m.details}
                <a class="text-gold underline underline-offset-4" href={m.details} target="_blank" rel="noreferrer"
                  >Wiki notes</a
                >
              {/if}
            </div>
          {/each}

          <div class="space-y-2">
            <h4 class="font-display text-sm font-semibold tracking-wider uppercase">Where to find it</h4>
            {#if group.locations.length === 0}
              <p class="text-muted-foreground text-sm">No known location.</p>
            {:else}
              <ul class="space-y-2">
                {#each group.locations as l}
                  <li class="bg-muted/60 flex gap-3 rounded-lg p-3 text-sm">
                    <MapPin class="text-gold mt-0.5 size-4 shrink-0" />
                    <div>
                      <p class="font-medium">{l.type}{l.npc ? `: ${l.npc}` : ''}{l.quest ? `: ${l.quest}` : ''}</p>
                      {#if l.area || l.territory || l.region}
                        <p class="text-muted-foreground">{[l.area, l.territory, l.region].filter(Boolean).join(', ')}</p>
                      {/if}
                      {#if l.note}
                        <p class="text-muted-foreground mt-1 text-xs">{l.note}</p>
                      {/if}
                    </div>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
