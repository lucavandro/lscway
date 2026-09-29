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
    <div class="hour-wrap">
      <span class="hour-num">{hourIndex + 1}ª</span>
      <span class="hour-time-label">{hour}</span>
    </div>
  </th>

  {#each weekdays as weekday}
    {@const isToday = weekday === currentDay}
    {@const isActiveSlot = hourIndex === currentHour - 1 && isToday}
    {@const dayEntries = filteredRowData[weekday] || []}
    {@const hasPot = dayEntries.some((e) => e.materia === "POT" || e.materia === "sub_potenziamento" || e.materia === "RIC")}

    <td
      class="day-slot"
      class:is-today={isToday}
      class:is-active-slot={isActiveSlot}
      class:is-pot-slot={hasPot}
    >
      {#if dayEntries.length > 0}
        <div class="slot-stack">
          {#each dayEntries as entry, idx}
            {@const isSostegno = entry["materia"] === "MADISO" || entry["materia"] === "INC"}
            {@const isPot = entry["materia"] === "POT" || entry["materia"] === "sub_potenziamento" || entry["materia"] === "RIC"}
            {@const isSecondarySostegno = idx > 0 && isSostegno}
            {@const hasPrimary = (fields.includes("classe") && entry["classe"] && !isSecondarySostegno) || (fields.includes("docente") && entry["docente"])}
            {@const showAula = fields.includes("aula") && entry["aula"] && entry["aula"] !== "-" && !isSecondarySostegno}

            <div class="entry-micro" class:is-pot-entry={isPot}>
              <!-- Line 1: Primary identifier (Docente in class view, Classe in teacher/room view) -->
              <div class="line-primary">
                {#if fields.includes("classe") && entry["classe"] && !isSecondarySostegno}
                  <span class="primary-label class-label">{entry["classe"]}</span>
                {/if}

                {#if fields.includes("docente") && entry["docente"]}
                  <span class="primary-label teacher-label" title={entry["docente"]}>
                    {entry["docente_abbr"] || entry["docente"]}
                  </span>
                {/if}

                {#if !hasPrimary}
                  {#if isPot}
                    <span class="primary-label pot-hero">Potenziamento</span>
                  {:else if entry["materia"]}
                    <span class="primary-label fallback-label">{entry["materia"]}</span>
                  {/if}
                {/if}
              </div>

              <!-- Line 2: Secondary info (Materia and Aula, stacked on mobile, side-by-side on tablet/desktop) -->
              {#if entry["materia"] || showAula}
                <div class="line-secondary">
                  {#if entry["materia"]}
                    <span
                      class="subj-tag"
                      class:is-pot={isPot}
                      class:is-sostegno={isSostegno}
                    >
                      {entry["materia"]}
                    </span>
                  {/if}

                  {#if entry["materia"] && showAula}
                    <span class="sec-sep" aria-hidden="true">•</span>
                  {/if}

                  {#if showAula}
                    <span class="room-sub">{entry["aula"]}</span>
                  {/if}
                </div>
              {/if}
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

  .hour-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .hour-num {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--brand-text);
    line-height: 1;
  }

  .hour-time-label {
    display: none;
    font-size: 0.65rem;
    font-weight: 500;
    color: var(--brand-text-muted);
    line-height: 1.1;
    margin-top: 0.15rem;
    white-space: nowrap;
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
    gap: 0.25rem;
    flex-wrap: wrap;
    width: 100%;
  }

  .primary-label {
    font-weight: 700;
    color: var(--brand-text);
    line-height: 1.2;
    white-space: nowrap;
  }

  .class-label {
    font-size: 0.775rem;
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  .teacher-label {
    font-size: 0.725rem;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 68px;
  }

  .fallback-label {
    font-size: 0.725rem;
    font-weight: 700;
  }

  .day-slot.is-pot-slot {
    background: color-mix(in srgb, #f59e0b 9%, var(--brand-surface-card));
    border-left: 2px solid #f59e0b;
  }

  .day-slot.is-pot-slot.is-today {
    background: color-mix(in srgb, #f59e0b 16%, var(--brand-surface-card));
  }

  .primary-label.pot-hero {
    color: #b45309;
    font-size: 0.725rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  :global([data-theme="dark"]) .primary-label.pot-hero,
  :global(.dark) .primary-label.pot-hero {
    color: #fbbf24;
  }

  /* Secondary line: Stacked vertically on mobile, row on tablet/desktop */
  .line-secondary {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.15rem;
    margin-top: 0.15rem;
    width: 100%;
  }

  .sec-sep {
    display: none;
  }

  .subj-tag {
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.05rem 0.25rem;
    border-radius: 3px;
    background: color-mix(in srgb, var(--brand-primary) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--brand-primary) 22%, transparent);
    color: var(--brand-primary);
    white-space: nowrap;
    line-height: 1.15;
  }

  .subj-tag.is-pot {
    background: rgba(245, 158, 11, 0.18);
    color: #b45309;
    border-color: rgba(245, 158, 11, 0.45);
    font-weight: 700;
  }

  :global([data-theme="dark"]) .subj-tag.is-pot,
  :global(.dark) .subj-tag.is-pot {
    color: #fbbf24;
    background: rgba(245, 158, 11, 0.22);
    border-color: rgba(245, 158, 11, 0.5);
  }

  .subj-tag.is-sostegno {
    background: rgba(99, 102, 241, 0.12);
    color: #4f46e5;
    border-color: rgba(99, 102, 241, 0.3);
    font-weight: 700;
  }

  :global([data-theme="dark"]) .subj-tag.is-sostegno,
  :global(.dark) .subj-tag.is-sostegno {
    color: #818cf8;
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.45);
  }

  .room-sub {
    font-size: 0.65rem;
    font-weight: 600;
    color: #059669;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.25);
    padding: 0.05rem 0.25rem;
    border-radius: 3px;
    white-space: nowrap;
    line-height: 1.15;
  }

  .sec-sep {
    font-size: 0.65rem;
    color: var(--brand-text-muted);
    opacity: 0.6;
    line-height: 1;
    user-select: none;
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

  @media (min-width: 640px) {
    .hour-fixed-col {
      width: 58px;
      min-width: 58px;
      max-width: 58px;
      padding: 0.45rem 0.25rem;
    }
    .hour-num {
      font-size: 0.9rem;
      font-weight: 800;
    }
    .hour-time-label {
      display: block;
    }
    .day-slot {
      padding: 0.5rem 0.35rem;
    }
    .slot-stack {
      gap: 0.25rem;
    }
    .line-primary {
      gap: 0.35rem;
    }
    .class-label {
      font-size: 0.875rem;
      font-weight: 800;
    }
    .teacher-label {
      font-size: 0.825rem;
      font-weight: 700;
      max-width: 110px;
    }
    .fallback-label {
      font-size: 0.825rem;
    }
    .primary-label.pot-hero {
      font-size: 0.825rem;
    }
    .line-secondary {
      display: inline-flex;
      flex-direction: row;
      gap: 0.35rem;
      margin-top: 0.2rem;
      width: auto;
    }
    .subj-tag {
      font-size: 0.75rem;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }
    .room-sub {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }
    .sec-sep {
      display: inline;
      font-size: 0.75rem;
    }
  }

  @media (min-width: 1024px) {
    .hour-fixed-col {
      width: 72px;
      min-width: 72px;
      max-width: 72px;
      padding: 0.6rem 0.35rem;
    }
    .hour-num {
      font-size: 1rem;
    }
    .hour-time-label {
      font-size: 0.725rem;
    }
    .day-slot {
      padding: 0.65rem 0.5rem;
    }
    .slot-stack {
      gap: 0.35rem;
    }
    .line-primary {
      gap: 0.45rem;
    }
    .class-label {
      font-size: 0.95rem;
    }
    .teacher-label {
      font-size: 0.875rem;
      max-width: none;
    }
    .fallback-label {
      font-size: 0.875rem;
    }
    .primary-label.pot-hero {
      font-size: 0.875rem;
    }
    .line-secondary {
      gap: 0.4rem;
      margin-top: 0.25rem;
    }
    .subj-tag {
      font-size: 0.8rem;
      padding: 0.12rem 0.45rem;
      border-radius: 5px;
    }
    .room-sub {
      font-size: 0.8rem;
      padding: 0.12rem 0.45rem;
      border-radius: 5px;
    }
    .sec-sep {
      font-size: 0.8rem;
    }
    .day-slot:hover {
      background: color-mix(in srgb, var(--brand-primary) 6%, var(--brand-surface-card));
    }
  }
</style>
