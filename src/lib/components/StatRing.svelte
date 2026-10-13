<script lang="ts">
  let {
    value,
    total,
    label,
    sub,
  }: { value: number; total: number; label: string; sub?: string } = $props()

  const R = 34
  const C = 2 * Math.PI * R
  const pct = $derived(total ? value / total : 0)
</script>

<div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
  <div class="relative size-20 shrink-0">
    <svg viewBox="0 0 80 80" class="size-full -rotate-90" aria-hidden="true">
      <circle cx="40" cy="40" r={R} fill="none" stroke="currentColor" stroke-width="6" class="text-muted" />
      <circle
        cx="40"
        cy="40"
        r={R}
        fill="none"
        stroke="url(#ring-gold)"
        stroke-width="6"
        stroke-linecap="round"
        stroke-dasharray={C}
        stroke-dashoffset={C * (1 - pct)}
        class="transition-[stroke-dashoffset] duration-700 ease-out"
      />
      <defs>
        <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="var(--gold-bright)" />
          <stop offset="100%" stop-color="var(--gold-deep)" />
        </linearGradient>
      </defs>
    </svg>
    <span class="absolute inset-0 grid place-items-center text-sm font-semibold tabular-nums">
      {Math.round(pct * 100)}%
    </span>
  </div>
  <div class="min-w-0">
    <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">{label}</p>
    <p class="font-display text-2xl font-semibold tabular-nums">
      {value}<span class="text-muted-foreground text-base font-normal"> / {total}</span>
    </p>
    {#if sub}<p class="text-muted-foreground text-xs">{sub}</p>{/if}
  </div>
</div>
