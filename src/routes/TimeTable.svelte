<script>
  import TimeTableRow from "./TimeTableRow.svelte";
  import EasterEggQuote from "./EasterEggQuote.svelte";
  import { base } from "$app/paths";
  import { clockStore } from "$lib/dateutils.js";

  export let data = [];
  export let fields = [];
  export let day = undefined;
  export let isChristmas = undefined;

  const xmasWebps = ["xmas1.webp", "xmas2.webp", "xmas3.webp"];
  let randomXmasWebp = xmasWebps[Math.floor(Math.random() * xmasWebps.length)];

  $: activeDay = day !== undefined ? day : $clockStore.day;
  $: activeIsChristmas = isChristmas !== undefined ? isChristmas : $clockStore.isChristmas;
  $: isSaturday = activeDay === "SAB" || activeDay === 6;
  $: isSunday = activeDay === "DOM" || activeDay === 0;
</script>

{#if activeIsChristmas}
  <div class="easteregg-container">
    <img
      src="{base}/eastereggs/{randomXmasWebp}"
      alt="Buone Feste!"
      class="easteregg-gif"
    />
    <EasterEggQuote />
  </div>
{:else if isSaturday}
  <div class="easteregg-container">
    <img
      src="{base}/eastereggs/saturday.webp"
      alt="Sabato"
      class="easteregg-gif"
    />
    <EasterEggQuote />
  </div>
{:else if isSunday}
  <div class="easteregg-container">
    <img
      src="{base}/eastereggs/sunday.webp"
      alt="Domenica"
      class="easteregg-gif"
    />
    <EasterEggQuote />
  </div>
{:else}
  <div class="daily-table-container">
    <table class="daily-timetable">
      <thead>
        <tr>
          <th class="col-hour" scope="col">Ora</th>
          {#each fields as field}
            <th scope="col" class="col-{field}">{field}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each { length: 7 } as _, i}
          <TimeTableRow hourIndex={i} bind:data {fields} />
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
  .daily-table-container {
    width: 100%;
    overflow-x: hidden; /* Guarantee no horizontal scroll on mobile */
    border-radius: 12px;
    border: 1px solid var(--brand-border);
    background: var(--brand-surface-card);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .daily-timetable {
    width: 100%;
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: 0;
    margin: 0;
    font-size: calc(1rem * var(--table-font-scale, 1));
  }

  thead {
    position: sticky;
    inset-block-start: 0;
    z-index: 3;
    background: var(--brand-surface-subtle);
  }

  thead th {
    padding: 0.65rem 0.35rem;
    font-size: calc(0.875rem * var(--table-font-scale, 1));
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--brand-text-muted);
    border-bottom: 2px solid var(--brand-border);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .col-hour {
    width: calc(52px * var(--table-font-scale, 1));
    min-width: calc(52px * var(--table-font-scale, 1));
    max-width: calc(56px * var(--table-font-scale, 1));
    text-align: center;
    border-right: 1px solid var(--brand-border);
  }

  :global(.col-aula) {
    width: 22%;
  }

  :global(.col-materia) {
    width: 25%;
  }

  :global(.col-docente),
  :global(.col-classe) {
    width: auto; /* Takes all remaining width */
  }

  .easteregg-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
    padding: 2rem 1rem;
    border-radius: 12px;
    border: 1px solid var(--brand-border);
    background: var(--brand-surface-card);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .easteregg-gif {
    width: 280px;
    max-width: 100%;
    height: auto;
    object-fit: contain;
    user-select: none;
    -webkit-user-drag: none;
  }

  @media (max-width: 640px) {
    .easteregg-container {
      padding: 1.5rem 0.75rem;
      gap: 1rem;
    }
    .easteregg-gif {
      width: 176px;
    }
  }

  @media (max-width: 400px) {
    thead th {
      padding: 0.55rem 0.25rem;
      font-size: calc(0.825rem * var(--table-font-scale, 1));
    }
    .col-hour {
      width: calc(48px * var(--table-font-scale, 1));
      min-width: calc(48px * var(--table-font-scale, 1));
      max-width: calc(52px * var(--table-font-scale, 1));
    }
  }
</style>
