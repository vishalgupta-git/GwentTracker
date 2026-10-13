<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import LoaderCircle from '@lucide/svelte/icons/loader-circle'
  import Sparkles from '@lucide/svelte/icons/sparkles'
  import Upload from '@lucide/svelte/icons/upload'

  let {
    onfile,
    onsample,
    loading = false,
    compact = false,
  }: { onfile: (file: File) => void; onsample: () => void; loading?: boolean; compact?: boolean } = $props()

  let dragging = $state(false)
  let input: HTMLInputElement

  function pick(files: FileList | null | undefined) {
    const file = files?.[0]
    if (file && !loading) onfile(file)
  }
</script>

<div
  role="region"
  aria-label="Upload your save"
  aria-busy={loading}
  class={[
    'panel relative transition-all duration-200',
    dragging && 'ring-gold/60 scale-[1.01] ring-2',
    compact ? 'p-4' : 'p-8 sm:p-10',
  ]}
  ondragover={(e) => {
    e.preventDefault()
    dragging = true
  }}
  ondragleave={() => (dragging = false)}
  ondrop={(e) => {
    e.preventDefault()
    dragging = false
    pick(e.dataTransfer?.files)
  }}
>
  {#if !compact}
    <!-- Ornate corners -->
    {#each ['top-3 left-3', 'top-3 right-3 rotate-90', 'bottom-3 right-3 rotate-180', 'bottom-3 left-3 -rotate-90'] as pos (pos)}
      <svg viewBox="0 0 24 24" class={['text-gold/60 absolute size-6', pos]} aria-hidden="true">
        <path d="M2 14V2h12M2 8h4V4" fill="none" stroke="currentColor" stroke-width="1.5" />
      </svg>
    {/each}
  {/if}

  <input
    bind:this={input}
    type="file"
    accept=".sav,.json,.txt"
    class="hidden"
    onchange={(e) => {
      pick(e.currentTarget.files)
      e.currentTarget.value = ''
    }}
  />

  {#if compact}
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-muted-foreground text-sm">Played some more? Drop a newer save here to re-check.</p>
      <Button variant="outline" size="sm" disabled={loading} onclick={() => input.click()}>
        {#if loading}<LoaderCircle class="animate-spin" /> Reading…{:else}<Upload /> Upload new save{/if}
      </Button>
    </div>
  {:else}
    <div class="flex flex-col items-center gap-5 text-center">
      <div
        class={[
          'border-gold/40 bg-gold/10 text-gold grid size-16 place-items-center rounded-full border',
          dragging && 'animate-pulse',
        ]}
      >
        {#if loading}<LoaderCircle class="size-7 animate-spin" />{:else}<Upload class="size-7" />{/if}
      </div>
      <div class="space-y-1.5">
        <p class="font-display text-xl font-semibold">
          {loading ? 'Reading your save…' : dragging ? 'Drop it here' : 'Drop your save file here'}
        </p>
        <p class="text-muted-foreground mx-auto max-w-md text-sm">
          Any <code class="bg-muted rounded px-1">.sav</code> from your latest playthrough. On PC you'll find them in
          <code class="bg-muted inline-block rounded px-1">Documents\The Witcher 3\gamesaves</code>
        </p>
      </div>
      <div class="flex flex-wrap justify-center gap-2">
        <Button size="lg" class="px-5 shadow-[0_0_24px_-6px_var(--glow)]" disabled={loading} onclick={() => input.click()}>
          <Upload /> Choose save file
        </Button>
        <Button size="lg" variant="ghost" disabled={loading} onclick={onsample}><Sparkles /> Try a sample</Button>
      </div>
    </div>
  {/if}
</div>
