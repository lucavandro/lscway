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

<tr class="compact-row">
  <!-- Sticky Hour cell on the left -->
  <th class="hour-fixed-col" scope="row">
    <span class="hour-num">{hourIndex + 1}ª</span>
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
        <div class="slot-stack">
          {#each dayEntries as entry, idx}
            <div class="entry-micro">
              <!-- Line 1: Primary identifiers -->
              <div class="line-primary">
                {#if fields.includes("classe") && entry["classe"]}
                  <span class="class-label">{entry["classe"]}</span>
                {/if}

                {#if entry["materia"]}
                  <span class="subj-tag" class:is-pot={entry["materia"] === "POT" || entry["materia"] === "RIC"}>
                    {entry["materia"]}
                  </span>
                {/if}

                {#if fields.includes("docente") && !fields.includes("classe")}
                  <span class="teacher-label" title={entry["docente"]}>
                    {entry["docente_abbr"] || entry["docente"]}
                  </span>
                {/if}
              </div>

              <!-- Line 2: Secondary info (Room or Teacher when class is primary) -->
              <div class="line-secondary">
                {#if fields.includes("docente") && fields.includes("classe")}
                  <span class="teacher-sub" title={entry["docente"]}>
                    {entry["docente_abbr"] || entry["docente"]}
                  </span>
                {/if}

                {#if fields.includes("aula") && entry["aula"] && entry["aula"] !== "-"}
                  <span class="room-sub">A.{entry["aula"]}</span>
                {/if}
              </div>
            </div>

            {#if idx < dayEntries.length - 1}
              <div class="micro-sep"></div>
            {/if}
          {/each}
        </div>
      {:else}
        <span class="empty-dot">·</span>
      {/if}
    </td>
  {/each}
</tr>

<style>
  .compact-row:not(:last-child) td,
  .compact-row:not(:last-child) th {
    border-bottom: 1px solid var(--brand-border);
  }

  .hour-fixed-col {
    position: sticky;
    inset-inline-start: 0;
    z-index: 2;
    background: var(--brand-surface-card);
    border-right: 1px solid var(--brand-border);
    padding: 0.25rem 0.15rem;
    text-align: center;
    width: 36px;
    min-width: 36px;
    max-width: 36px;
    vertical-align: middle;
  }

  .hour-num {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--brand-text);
    line-height: 1;
  }

  .day-slot {
    padding: 0.25rem 0.2rem;
    text-align: center;
    vertical-align: middle;
    border-right: 1px solid var(--brand-border);
    transition: background-color 0.15s ease;
    overflow: hidden;
  }

  .day-slot.is-today {
    background: color-mix(in srgb, var(--brand-primary) 3%, transparent);
  }

  .day-slot.is-active-slot {
    background: color-mix(in srgb, var(--brand-primary) 12%, var(--brand-surface-card));
    box-shadow: inset 0 0 0 2px var(--brand-primary);
  }

  .slot-stack {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .entry-micro {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    line-height: 1.15;
  }

  .line-primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    flex-wrap: wrap;
    font-size: 0.725rem;
  }

  .class-label {
    font-weight: 700;
    color: var(--brand-text);
  }

  .subj-tag {
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.05rem 0.25rem;
    border-radius: 3px;
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
    color: var(--brand-primary);
    white-space: nowrap;
  }

  .subj-tag.is-pot {
    background: rgba(245, 158, 11, 0.12);
    color: #f59e0b;
    border-color: rgba(245, 158, 11, 0.25);
  }

  .teacher-label {
    font-weight: 600;
    font-size: 0.7rem;
    color: var(--brand-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 68px;
  }

  .line-secondary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    font-size: 0.65rem;
    color: var(--brand-text-muted);
    margin-top: 0.05rem;
  }

  .teacher-sub {
    font-size: 0.65rem;
    color: var(--brand-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 58px;
  }

  .room-sub {
    font-size: 0.65rem;
    font-weight: 600;
    color: #10b981;
    background: rgba(16, 185, 129, 0.08);
    padding: 0.05rem 0.25rem;
    border-radius: 3px;
    white-space: nowrap;
  }

  .micro-sep {
    width: 60%;
    height: 1px;
    background: var(--brand-border);
    margin: 0.1rem auto;
  }

  .empty-dot {
    color: var(--brand-text-muted);
    opacity: 0.3;
    font-size: 0.9rem;
    line-height: 1;
  }
</style>
