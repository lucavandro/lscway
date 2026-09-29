<script>
  import TimeTableRow from "./TimeTableRow.svelte";
  export let data = [];
  export let fields = [];
</script>

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
    font-size: 0.85rem;
  }

  thead {
    position: sticky;
    inset-block-start: 0;
    z-index: 3;
    background: var(--brand-surface-subtle);
  }

  thead th {
    padding: 0.55rem 0.35rem;
    font-size: 0.725rem;
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
    width: 44px;
    min-width: 44px;
    max-width: 48px;
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

  @media (max-width: 400px) {
    thead th {
      padding: 0.45rem 0.2rem;
      font-size: 0.675rem;
    }
    .col-hour {
      width: 40px;
      min-width: 40px;
    }
  }
</style>
