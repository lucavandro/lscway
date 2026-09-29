<script>
  import TimeTableRow from "./TimeTableRow.svelte";
  export let data = [];
  export let fields = [];

  let scrollContainer;
  let isScrolledEnd = false;

  function handleScroll(e) {
    const el = e.currentTarget;
    isScrolledEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
  }
</script>

<div
  bind:this={scrollContainer}
  class="table-scroll-container"
  class:scrolled-right={isScrolledEnd}
  on:scroll={handleScroll}
>
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

<style>
  .daily-timetable {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 0;
    font-size: 0.95rem;
  }

  thead {
    position: sticky;
    inset-block-start: 0;
    z-index: 3;
    background: var(--brand-surface-subtle);
  }

  thead th {
    padding: 0.75rem 1rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--brand-text-muted);
    border-bottom: 2px solid var(--brand-border);
    white-space: nowrap;
    text-align: center;
  }

  .col-hour {
    width: 60px;
    text-align: center;
    position: sticky;
    inset-inline-start: 0;
    background: var(--brand-surface-subtle);
    z-index: 4;
    border-right: 1px solid var(--brand-border);
  }
</style>
