<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import FileJson from '@lucide/svelte/icons/file-json'
  import Upload from '@lucide/svelte/icons/upload'

  let {
    onfile,
    onsample,
    compact = false,
  }: { onfile: (file: File) => void; onsample: () => void; compact?: boolean } = $props()

  let dragging = $state(false)
  let input: HTMLInputElement

  function pick(files: FileList | null | undefined) {
    const file = files?.[0]
    if (file) onfile(file)
  }
</script>

<div
  role="region"
  aria-label="Upload your collection"
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
    accept=".json,.txt,application/json,text/plain"
    class="hidden"
    onchange={(e) => {
      pick(e.currentTarget.files)
      e.currentTarget.value = ''
    }}
  />

  {#if compact}
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-muted-foreground text-sm">Drop another file here to re-check.</p>
      <Button variant="outline" size="sm" onclick={() => input.click()}>
        <Upload /> Upload new file
      </Button>
    </div>
  {:else}
    <div class="flex flex-col items-center gap-4 text-center">
      <div class="bg-muted rounded-full p-3"><FileJson class="size-6" /></div>
      <div class="space-y-1">
        <p class="font-medium">Drop your collection file here</p>
        <p class="text-muted-foreground max-w-md text-sm">
          A <code class="bg-muted rounded px-1">gwentCards</code> JSON export of your save (<code
            class="bg-muted rounded px-1">.json</code
          >
          or <code class="bg-muted rounded px-1">.txt</code>). Direct <code class="bg-muted rounded px-1">.sav</code>
          upload is coming soon.
        </p>
      </div>
      <div class="flex flex-wrap justify-center gap-2">
        <Button onclick={() => input.click()}><Upload /> Choose file</Button>
        <Button variant="ghost" onclick={onsample}>Try with a sample</Button>
      </div>
      <p class="text-muted-foreground text-xs">Your file never leaves your browser.</p>
    </div>
  {/if}
</div>
