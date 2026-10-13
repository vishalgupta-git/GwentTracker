<script lang="ts">
  import { STEPS } from '$lib/content/site'
</script>

<section aria-labelledby="how-title" class="mx-auto max-w-5xl">
  <h2 id="how-title" class="font-display mb-8 text-center text-2xl font-semibold sm:text-3xl">How it works</h2>
  <ol class="grid gap-6 sm:grid-cols-3">
    {#each STEPS as step, i (step.title)}
      <li class="relative text-center">
        {#if i < STEPS.length - 1}
          <span
            class="from-gold/50 absolute top-7 left-[calc(50%+2.5rem)] hidden h-px w-[calc(100%-5rem)] bg-gradient-to-r to-transparent sm:block"
            aria-hidden="true"
          ></span>
        {/if}
        <span
          class="border-gold/50 bg-gold/10 text-gold font-display mx-auto mb-4 grid size-14 place-items-center rounded-full border text-xl font-bold shadow-[0_0_24px_-8px_var(--glow)]"
          >{i + 1}</span
        >
        <h3 class="font-display text-lg font-semibold">{step.title}</h3>
        <p class="text-muted-foreground mx-auto mt-1 max-w-xs text-sm">{step.text}</p>
      </li>
    {/each}
  </ol>
</section>
