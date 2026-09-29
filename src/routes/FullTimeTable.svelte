<script>
  import FullTimeTableRow from "./FullTimeTableRow.svelte";
  import { weekdays, hours, getDay } from "$lib/dateutils.js";
  export let tableData = [];
  export let fields = [];

  let isScrolledEnd = false;
  let currentDay = getDay();

  const weekdayFullNames = {
    LUN: "Lunedì",
    MAR: "Martedì",
    MER: "Mercoledì",
    GIO: "Giovedì",
    VEN: "Venerdì",
  };

  $: rowsData = [
    tableData.filter((e) => e.ora === hours[0]),
    tableData.filter((e) => e.ora === hours[1]),
    tableData.filter((e) => e.ora === hours[2]),
    tableData.filter((e) => e.ora === hours[3]),
    tableData.filter((e) => e.ora === hours[4]),
    tableData.filter((e) => e.ora === hours[5]),
    tableData.filter((e) => e.ora === hours[6]),
    tableData.filter((e) => e.ora === hours[7]),
  ];

  function handleScroll(e) {
    const el = e.currentTarget;
    isScrolledEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
  }
</script>

<div
  class="table-scroll-container compact-scroll"
  class:scrolled-right={isScrolledEnd}
  on:scroll={handleScroll}
>
  <table class="compact-timetable">
    <thead>
      <tr>
        <th class="col-hour fixed-col" scope="col">#</th>
        {#each weekdays as weekday}
          <th scope="col" class="weekday-header" class:is-today={weekday === currentDay}>
            <div class="weekday-cell">
              <span class="weekday-short">{weekday}</span>
              <span class="weekday-long">{weekdayFullNames[weekday]}</span>
              {#if weekday === currentDay}
                <span class="today-dot" title="Oggi"></span>
              {/if}
            </div>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each { length: 7 } as _, i}
        <FullTimeTableRow hourIndex={i} bind:rowData={rowsData[i]} {fields} />
      {/each}
    </tbody>
  </table>
</div>

<style>
  .compact-scroll {
    border-radius: 12px;
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .compact-timetable {
    width: 100%;
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: 0;
    margin: 0;
    font-size: 0.75rem;
  }

  thead {
    position: sticky;
    inset-block-start: 0;
    z-index: 3;
    background: var(--brand-surface-subtle);
  }

  th {
    padding: 0.45rem 0.2rem;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--brand-text-muted);
    border-bottom: 2px solid var(--brand-border);
    white-space: nowrap;
    text-align: center;
  }

  .col-hour.fixed-col {
    position: sticky;
    inset-inline-start: 0;
    z-index: 4;
    background: var(--brand-surface-subtle);
    border-right: 1px solid var(--brand-border);
    width: 36px;
    min-width: 36px;
    max-width: 36px;
    font-size: 0.75rem;
  }

  .weekday-header {
    min-width: 76px;
    border-right: 1px solid var(--brand-border);
    transition: background-color 0.15s ease;
  }

  .weekday-short {
    display: inline;
    line-height: 1;
  }

  .weekday-long {
    display: none;
    line-height: 1;
  }

  .weekday-header.is-today {
    color: var(--brand-primary);
    background: color-mix(in srgb, var(--brand-primary) 10%, var(--brand-surface-subtle));
  }

  .weekday-cell {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
  }

  .today-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--brand-primary);
    display: inline-block;
  }

  @media (min-width: 640px) {
    .compact-timetable {
      font-size: 0.85rem;
    }
    th {
      padding: 0.65rem 0.4rem;
      font-size: 0.875rem;
    }
    .col-hour.fixed-col {
      width: 58px;
      min-width: 58px;
      max-width: 58px;
      font-size: 0.825rem;
    }
    .weekday-header {
      min-width: 100px;
    }
    .weekday-short {
      display: none;
    }
    .weekday-long {
      display: inline;
    }
  }

  @media (min-width: 1024px) {
    .compact-timetable {
      font-size: 0.9rem;
    }
    th {
      padding: 0.8rem 0.5rem;
      font-size: 0.925rem;
    }
    .col-hour.fixed-col {
      width: 72px;
      min-width: 72px;
      max-width: 72px;
      font-size: 0.875rem;
    }
    .weekday-header {
      min-width: 120px;
    }
    .today-dot {
      width: 7px;
      height: 7px;
    }
  }
</style>
