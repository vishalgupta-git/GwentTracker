<script lang="ts">
  import { cardArt } from '$lib/display'

  // Iconic hand: Triss, Yennefer, Geralt (center), Ciri, Dandelion.
  const HAND = [
    { index: 11, name: 'Triss Merigold' },
    { index: 9, name: 'Yennefer of Vengerberg' },
    { index: 7, name: 'Geralt of Rivia' },
    { index: 10, name: 'Ciri' },
    { index: 12, name: 'Dandelion' },
  ]
  const mid = (HAND.length - 1) / 2
</script>

<div class="fan group relative mx-auto aspect-[5/4] w-full max-w-md lg:max-w-xl" aria-hidden="true">
  <div
    class="from-gold/25 absolute inset-x-8 bottom-4 h-1/2 rounded-full bg-radial to-transparent blur-2xl"
  ></div>
  {#each HAND as card, i (card.index)}
    {@const offset = i - mid}
    <img
      src={cardArt(card.index)}
      alt=""
      width="280"
      height="527"
      class="fan-card absolute bottom-0 left-1/2 w-[30%] origin-bottom drop-shadow-[0_12px_20px_rgba(0,0,0,0.45)]"
      style:--o={offset}
      style:--a={Math.abs(offset)}
      style:z-index={10 - Math.abs(offset)}
    />
  {/each}
</div>

<style>
  .fan-card {
    --spread: 11deg;
    --shift: 24%;
    transform: translateX(calc(-50% + var(--o) * var(--shift))) translateY(calc(var(--a) * 4%))
      rotate(calc(var(--o) * var(--spread)));
    transition: transform 450ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .fan:hover .fan-card {
    --spread: 15deg;
    --shift: 34%;
  }
  .fan-card:hover {
    transform: translateX(calc(-50% + var(--o) * var(--shift))) translateY(calc(var(--a) * 4% - 8%))
      rotate(calc(var(--o) * var(--spread)));
  }
  @media (prefers-reduced-motion: reduce) {
    .fan-card {
      transition: none;
    }
  }
</style>
