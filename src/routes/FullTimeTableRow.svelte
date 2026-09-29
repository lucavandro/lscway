<script>
  export let rowData = [];
  export let hourIndex;
  export let fields;
  import { getDay, getHourNum, weekdays, hours } from "$lib/dateutils.js";
  import { onMount, onDestroy } from "svelte";
  import { inclusioneInFondo } from "$lib/utils.js";

  let currentDay = getDay();
  let currentHour = getHourNum();
  let interval;

  $: hour = hours[hourIndex];

  $: filteredRowData = {
    LUN: rowData.filter((e) => e.day === "LUN").sort(inclusioneInFondo),
    MAR: rowData.filter((e) => e.day === "MAR").sort(inclusioneInFondo),
    MER: rowData.filter((e) => e.day === "MER").sort(inclusioneInFondo),
    GIO: rowData.filter((e) => e.day === "GIO").sort(inclusioneInFondo),
    VEN: rowData.filter((e) => e.day === "VEN").sort(inclusioneInFondo),
  };

  function singleInfoExtraction(dayData, field) {
    let items = new Set();
    dayData.forEach((entry) => {
      if (entry[field]) {
        items.add(entry[field]);
      }
    });
    return Array.from(items).join(", ");
  }

  onMount(() => {
    interval = setInterval(() => {
      currentDay = getDay();
      currentHour = getHourNum();
    }, 1000);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>

<tr class="full-row">
  <!-- Sticky Hour cell on the left -->
  <th class="hour-fixed-col" scope="row">
    <span class="hour-num">{hourIndex + 1}ª</span>
    <span class="hour-sub">{hour}</span>
  </th>

  {#each weekdays as weekday}
    {@const isToday = weekday === currentDay}
    {@const isActiveSlot = hourIndex === currentHour - 1 && isToday}
    {@const dayEntries = filteredRowData[weekday] || []}

    <td
      class="day-slot"
      class:is-today={isToday}
      class:is-active-slot={isActiveSlot}
    >
      {#if dayEntries.length > 0}
        <div class="slot-content">
          {#if fields.includes("docente")}
            {#each dayEntries as entry}
              <div class="entry-card">
                <span class="teacher-name">{entry["docente_abbr"] || entry["docente"]}</span>
                {#if entry["materia"]}
                  <span class="subject-pill">{entry["materia"]}</span>
                {/if}
              </div>
            {/each}
          {:else if fields.includes("materia") && (singleInfoExtraction(dayEntries, "materia") === "POT" || singleInfoExtraction(dayEntries, "materia") === "RIC")}
            <div class="entry-card">
              <span class="subject-pill">{singleInfoExtraction(dayEntries, "materia")}</span>
            </div>
          {/if}

          {#if fields.includes("classe")}
            {@const classVal = singleInfoExtraction(dayEntries, "classe")}
            {#if classVal}
              <div class="meta-row class-row">
                <span class="meta-badge class-badge">{classVal}</span>
              </div>
            {/if}
          {/if}

          {#if fields.includes("aula")}
            {@const roomVal = singleInfoExtraction(dayEntries, "aula")}
            {#if roomVal && roomVal !== "-"}
              <div class="meta-row room-row">
                <span class="meta-badge room-badge">Aula {roomVal}</span>
              </div>
            {/if}
          {/if}

          {#if fields.includes("materia") && !fields.includes("docente")}
            {@const subjVal = singleInfoExtraction(dayEntries, "materia")}
            {#if subjVal && subjVal !== "POT" && subjVal !== "RIC"}
              <div class="meta-row">
                <span class="subject-pill">{subjVal}</span>
              </div>
            {/if}
          {/if}
        </div>
      {:else}
        <span class="empty-dash">—</span>
      {/if}
    </td>
  {/each}
</tr>

<style>
  .full-row:not(:last-child) td,
  .full-row:not(:last-child) th {
    border-bottom: 1px solid var(--brand-border);
  }

  .hour-fixed-col {
    position: sticky;
    inset-inline-start: 0;
    z-index: 2;
    background: var(--brand-surface-card);
    border-right: 1px solid var(--brand-border);
    padding: 0.5rem 0.25rem;
    text-align: center;
    width: 48px;
    min-width: 48px;
  }

  .hour-num {
    display: block;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--brand-text);
    line-height: 1;
  }

  .hour-sub {
    display: block;
    font-size: 0.65rem;
    color: var(--brand-text-muted);
    margin-top: 0.15rem;
  }

  .day-slot {
    padding: 0.5rem 0.4rem;
    text-align: center;
    vertical-align: middle;
    border-right: 1px solid var(--brand-border);
    transition: background-color 0.15s ease;
    min-width: 130px;
  }

  .day-slot.is-today {
    background: color-mix(in srgb, var(--brand-primary) 3%, transparent);
  }

  .day-slot.is-active-slot {
    background: color-mix(in srgb, var(--brand-primary) 12%, var(--brand-surface-card));
    box-shadow: inset 0 0 0 2px var(--brand-primary);
  }

  .slot-content {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    align-items: center;
    justify-content: center;
  }

  .entry-card {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .teacher-name {
    font-weight: 600;
    font-size: 0.825rem;
    color: var(--brand-text);
  }

  .subject-pill {
    display: inline-block;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
    font-size: 0.725rem;
    font-weight: 700;
    color: var(--brand-primary);
  }

  .meta-row {
    display: flex;
    justify-content: center;
  }

  .meta-badge {
    display: inline-block;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    font-size: 0.725rem;
    font-weight: 600;
  }

  .class-badge {
    background: color-mix(in srgb, var(--brand-text) 8%, transparent);
    color: var(--brand-text);
  }

  .room-badge {
    background: rgba(16, 185, 129, 0.12);
    color: #10b981;
  }

  .empty-dash {
    color: var(--brand-text-muted);
    opacity: 0.35;
    font-size: 0.9rem;
  }
</style>
