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
    min-width: calc(640px * var(--table-font-scale, 1));
    table-layout: auto;
    border-collapse: separate;
    border-spacing: 0;
    margin: 0;
    font-size: calc(0.9rem * var(--table-font-scale, 1));
  }

  thead {
    position: sticky;
    top: 0;
    inset-block-start: 0;
    z-index: 3;
    background: var(--brand-surface-subtle);
  }

  th {
    padding: 0.55rem 0.3rem;
    font-size: calc(0.875rem * var(--table-font-scale, 1));
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--brand-text-muted);
    border-bottom: 2px solid var(--brand-border);
    white-space: nowrap;
    text-align: center;
  }

  .col-hour.fixed-col {
    position: sticky;
    left: -1px;
    inset-inline-start: -1px;
    z-index: 4;
    background: var(--brand-surface-subtle);
    border-right: 1px solid var(--brand-border);
    box-shadow: -2px 0 0 0 var(--brand-surface-subtle), 2px 0 6px -2px rgba(0, 0, 0, 0.08);
    width: calc(52px * var(--table-font-scale, 1));
    min-width: calc(52px * var(--table-font-scale, 1));
    max-width: calc(52px * var(--table-font-scale, 1));
    font-size: calc(0.875rem * var(--table-font-scale, 1));
  }

  .weekday-header {
    width: 20%;
    min-width: calc(116px * var(--table-font-scale, 1));
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
      font-size: calc(0.85rem * var(--table-font-scale, 1));
    }
    th {
      padding: 0.65rem 0.4rem;
      font-size: calc(0.875rem * var(--table-font-scale, 1));
    }
    .col-hour.fixed-col {
      width: calc(58px * var(--table-font-scale, 1));
      min-width: calc(58px * var(--table-font-scale, 1));
      max-width: calc(58px * var(--table-font-scale, 1));
      font-size: calc(0.825rem * var(--table-font-scale, 1));
    }
    .weekday-header {
      min-width: calc(100px * var(--table-font-scale, 1));
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
      font-size: calc(0.9rem * var(--table-font-scale, 1));
    }
    th {
      padding: 0.8rem 0.5rem;
      font-size: calc(0.925rem * var(--table-font-scale, 1));
    }
    .col-hour.fixed-col {
      width: calc(72px * var(--table-font-scale, 1));
      min-width: calc(72px * var(--table-font-scale, 1));
      max-width: calc(72px * var(--table-font-scale, 1));
      font-size: calc(0.875rem * var(--table-font-scale, 1));
    }
    .weekday-header {
      min-width: calc(120px * var(--table-font-scale, 1));
    }
    .today-dot {
      width: 7px;
      height: 7px;
    }
  }
</style>
