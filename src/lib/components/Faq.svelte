<script lang="ts">
  import { FAQ } from '$lib/content/site'
  import ChevronDown from '@lucide/svelte/icons/chevron-down'
</script>

<section aria-labelledby="faq-title" class="mx-auto max-w-3xl">
  <h2 id="faq-title" class="font-display mb-6 text-center text-2xl font-semibold sm:text-3xl">
    Frequently asked questions
  </h2>
  <div class="panel divide-border divide-y">
    {#each FAQ as item (item.q)}
      <details class="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
        <summary class="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
          {item.q}
          <ChevronDown class="text-gold size-4 shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <p class="text-muted-foreground mt-2 text-sm leading-relaxed">{item.a}</p>
      </details>
    {/each}
  </div>
</section>
