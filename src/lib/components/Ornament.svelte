<script lang="ts">
  let { class: className = '' }: { class?: string } = $props()
</script>

<div class={['text-gold flex items-center gap-3', className]} aria-hidden="true">
  <span class="h-px flex-1 bg-gradient-to-r from-transparent to-current opacity-60"></span>
  <svg viewBox="0 0 24 12" class="h-3 w-6 fill-current">
    <path d="M12 0l4 6-4 6-4-6zM2 6l3-2 3 2-3 2zM16 6l3-2 3 2-3 2z" />
  </svg>
  <span class="h-px flex-1 bg-gradient-to-l from-transparent to-current opacity-60"></span>
</div>
