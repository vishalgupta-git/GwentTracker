<script lang="ts">
  import * as Card from '$lib/components/ui/card'
  import { cardArt } from '$lib/display'
  import type { MissableStatus, ReferenceCard } from '$lib/types'
  import CircleCheck from '@lucide/svelte/icons/circle-check'
  import CircleX from '@lucide/svelte/icons/circle-x'
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert'

  let { items, onselect }: { items: MissableStatus[]; onselect: (card: ReferenceCard) => void } = $props()

  // Still winnable first; quests already missed in this playthrough last.
  const sorted = $derived([...items].sort((a, b) => Number(!!a.passed) - Number(!!b.passed)))
</script>

{#if items.length === 0}
  <p class="text-muted-foreground panel py-12 text-center text-sm">
    Nothing at risk. You already own every missable card in this view.
  </p>
{:else}
  <div class="grid gap-4 sm:grid-cols-2">
    {#each sorted as { group, missing, passed } (group.questName)}
      <Card.Root
        class={passed
          ? 'bg-muted/40'
          : 'border-destructive/30 from-destructive/10 bg-gradient-to-b to-transparent'}
      >
        <Card.Header>
          <Card.Title class="font-display flex items-start gap-2 text-lg">
            {#if passed}
              <CircleX class="text-muted-foreground mt-0.5 size-4 shrink-0" />
            {:else}
              <TriangleAlert class="text-destructive mt-0.5 size-4 shrink-0" />
            {/if}
            {group.questName}
          </Card.Title>
          <Card.Description>
            {group.region}{#if group.cutoff}
              · lost after <span class="text-foreground font-medium">{group.cutoff}</span>{/if}
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-3 text-sm">
          {#if passed}
            <p class="font-medium">
              Missed in this playthrough: your save is past {group.cutoff ?? group.questName}, so these can't be won
              any more.
            </p>
          {:else if passed === false}
            <p class="text-success flex items-center gap-1.5 font-medium">
              <CircleCheck class="size-4 shrink-0" /> Still possible: you haven't reached {group.cutoff ?? 'the end of this quest'}
              yet.
            </p>
          {/if}
          <div class="flex flex-wrap gap-2">
            {#each missing as card (card.index)}
              <button type="button" class="group w-24 text-left" onclick={() => onselect(card)}>
                <img
                  src={cardArt(card.index)}
                  alt={card.name} width="280" height="527"
                  loading="lazy"
                  class={['card-glow aspect-[280/527] w-full object-contain', passed && 'opacity-60 grayscale']}
                />
                              </button>
            {/each}
          </div>
          {#if group.notes.length}
            <p class="text-muted-foreground">{group.notes[0]}</p>
          {/if}
          {#if group.details}
            <a class="text-gold underline underline-offset-4" href={group.details} target="_blank" rel="noreferrer"
              >Wiki notes</a
            >
          {/if}
        </Card.Content>
      </Card.Root>
    {/each}
  </div>
{/if}
