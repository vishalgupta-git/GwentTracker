<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import FileArchive from '@lucide/svelte/icons/file-archive'
  import LoaderCircle from '@lucide/svelte/icons/loader-circle'
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
    'rounded-xl border-2 border-dashed transition-colors',
    dragging ? 'border-primary bg-primary/5' : 'border-border',
    compact ? 'p-4' : 'p-10',
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
      <p class="text-muted-foreground text-sm">Drop a newer save here to re-check.</p>
      <Button variant="outline" size="sm" disabled={loading} onclick={() => input.click()}>
        {#if loading}<LoaderCircle class="animate-spin" /> Reading…{:else}<Upload /> Upload new save{/if}
      </Button>
    </div>
  {:else}
    <div class="flex flex-col items-center gap-4 text-center">
      <div class="bg-muted rounded-full p-3">
        {#if loading}<LoaderCircle class="size-6 animate-spin" />{:else}<FileArchive class="size-6" />{/if}
      </div>
      <div class="space-y-1">
        <p class="font-medium">{loading ? 'Reading your save…' : 'Drop your Witcher 3 save file here'}</p>
        <p class="text-muted-foreground max-w-md text-sm">
          Pick any <code class="bg-muted rounded px-1">.sav</code> from your latest playthrough. On PC they're in
          <code class="bg-muted inline-block rounded px-1">Documents\The Witcher 3\gamesaves</code>.
        </p>
      </div>
      <div class="flex flex-wrap justify-center gap-2">
        <Button disabled={loading} onclick={() => input.click()}><Upload /> Choose save file</Button>
        <Button variant="ghost" disabled={loading} onclick={onsample}>Try with a sample</Button>
      </div>
      <p class="text-muted-foreground text-xs">
        Your save is read right here in your browser. It's never uploaded anywhere.
      </p>
    </div>
  {/if}
</div>
