<script lang="ts">
  import Moon from '@lucide/svelte/icons/moon'
  import Sun from '@lucide/svelte/icons/sun'

  let dark = $state(document.documentElement.classList.contains('dark'))

  function toggle() {
    dark = !dark
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    } catch {}
  }
</script>

<button
  type="button"
  onclick={toggle}
  aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
  title={dark ? 'Light theme' : 'Dark theme'}
  class="text-muted-foreground hover:text-gold hover:border-gold/40 bg-card/60 grid size-9 place-items-center rounded-full border backdrop-blur transition-colors"
>
  {#if dark}<Sun class="size-4" />{:else}<Moon class="size-4" />{/if}
</button>
