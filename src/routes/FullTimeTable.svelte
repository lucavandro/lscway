<script>
  import FullTimeTableRow from "./FullTimeTableRow.svelte";
  import { weekdays, hours, getDay } from "$lib/dateutils.js";
  export let tableData = [];
  export let fields = [];

  let isScrolledEnd = false;
  let currentDay = getDay();

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
  class="table-scroll-container"
  class:scrolled-right={isScrolledEnd}
  on:scroll={handleScroll}
>
  <table class="full-timetable">
    <thead>
      <tr>
        <th class="col-hour fixed-col" scope="col">Ora</th>
        {#each weekdays as weekday}
          <th scope="col" class="weekday-header" class:is-today={weekday === currentDay}>
            <div class="weekday-header-inner">
              <span>{weekday}</span>
              {#if weekday === currentDay}
                <span class="today-tag">Oggi</span>
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
  .full-timetable {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 0;
    font-size: 0.85rem;
  }

  thead {
    position: sticky;
    inset-block-start: 0;
    z-index: 3;
    background: var(--brand-surface-subtle);
  }

  th {
    padding: 0.65rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
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
    width: 48px;
    min-width: 48px;
  }

  .weekday-header {
    min-width: 130px;
    border-right: 1px solid var(--brand-border);
    transition: background-color 0.15s ease;
  }

  .weekday-header.is-today {
    color: var(--brand-primary);
    background: color-mix(in srgb, var(--brand-primary) 8%, var(--brand-surface-subtle));
  }

  .weekday-header-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
  }

  .today-tag {
    font-size: 0.6rem;
    font-weight: 700;
    background: var(--brand-primary);
    color: white;
    padding: 0.1rem 0.35rem;
    border-radius: 9999px;
    line-height: 1.1;
  }
</style>
