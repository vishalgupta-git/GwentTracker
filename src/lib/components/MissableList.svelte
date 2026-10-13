<script lang="ts">
  import * as Card from '$lib/components/ui/card'
  import { cardArt } from '$lib/display'
  import type { MissableStatus, ReferenceCard } from '$lib/types'
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert'

  let { items, onselect }: { items: MissableStatus[]; onselect: (card: ReferenceCard) => void } = $props()
</script>

{#if items.length === 0}
  <p class="text-muted-foreground py-10 text-center text-sm">
    Nothing at risk. You already own every missable card in this view.
  </p>
{:else}
  <div class="grid gap-4 sm:grid-cols-2">
    {#each items as { group, missing } (group.questName)}
      <Card.Root class="border-destructive/30">
        <Card.Header>
          <Card.Title class="flex items-start gap-2">
            <TriangleAlert class="text-destructive mt-0.5 size-4 shrink-0" />
            {group.questName}
          </Card.Title>
          <Card.Description>
            {group.region}{#if group.cutoff}
              · lost after <span class="text-foreground font-medium">{group.cutoff}</span>{/if}
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-3 text-sm">
          <div class="flex flex-wrap gap-2">
            {#each missing as card (card.index)}
              <button type="button" class="group w-20 text-left" onclick={() => onselect(card)}>
                <img
                  src={cardArt(card.index)}
                  alt={card.name}
                  loading="lazy"
                  class="aspect-[280/527] w-full object-contain drop-shadow transition-transform group-hover:-translate-y-0.5"
                />
                              </button>
            {/each}
          </div>
          {#if group.notes.length}
            <p class="text-muted-foreground">{group.notes[0]}</p>
          {/if}
          {#if group.details}
            <a class="text-primary underline underline-offset-4" href={group.details} target="_blank" rel="noreferrer"
              >Wiki notes</a
            >
          {/if}
        </Card.Content>
      </Card.Root>
    {/each}
  </div>
{/if}
