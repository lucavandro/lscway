<script>
  export let rowData = [];
  export let hourIndex;
  export let fields;
  import { clockStore, weekdays, hours } from "$lib/dateutils.js";
  import { inclusioneInFondo } from "$lib/utils.js";

  $: currentDay = $clockStore.day;
  $: currentHour = $clockStore.hourNum;
  $: hour = hours[hourIndex];

  $: filteredRowData = {
    LUN: rowData.filter((e) => e.day === "LUN").sort(inclusioneInFondo),
    MAR: rowData.filter((e) => e.day === "MAR").sort(inclusioneInFondo),
    MER: rowData.filter((e) => e.day === "MER").sort(inclusioneInFondo),
    GIO: rowData.filter((e) => e.day === "GIO").sort(inclusioneInFondo),
    VEN: rowData.filter((e) => e.day === "VEN").sort(inclusioneInFondo),
  };
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

    <td
      class="day-slot"
      class:is-today={isToday}
      class:is-active-slot={isActiveSlot}
    >
      {#if dayEntries.length > 0}
        <div class="slot-stack">
          {#each dayEntries as entry, idx}
            {@const isSostegno = entry["materia"] === "MADISO" || entry["materia"] === "INC"}
            {@const isPot = entry["materia"] === "POT" || entry["materia"] === "sub_potenziamento"}
            {@const isRic = entry["materia"] === "RIC" || entry["materia"] === "sub_ricevimento"}
            {@const isSecondarySostegno = idx > 0 && isSostegno}
            {@const isRoomView = fields.includes("classe") && fields.includes("docente")}
            {@const showPrimaryClass = fields.includes("classe") && !isRoomView && entry["classe"] && !isSecondarySostegno && !isPot}
            {@const showPrimaryTeacher = fields.includes("docente") && entry["docente"]}
            {@const hasPrimary = Boolean(showPrimaryClass || showPrimaryTeacher)}
            {@const showClassTag = isRoomView && entry["classe"] && !isSecondarySostegno && !isPot}
            {@const showAula = fields.includes("aula") && entry["aula"] && entry["aula"] !== "-" && !isSecondarySostegno && !isPot && !isRic}

            <div class="entry-micro">
              <!-- Line 1: Primary identifier (Docente in class/room view, Classe in teacher view) -->
              <div class="line-primary">
                {#if showPrimaryClass}
                  <span class="primary-label class-label">{entry["classe"]}</span>
                {/if}

                {#if showPrimaryTeacher}
                  <span class="primary-label teacher-label" title={entry["docente"]}>
                    {entry["docente_abbr"] || entry["docente"]}
                  </span>
                {/if}

                {#if !hasPrimary && entry["materia"]}
                  <span
                    class="subj-tag fallback-subj"
                    class:is-pot={isPot}
                    class:is-ric={isRic}
                    class:is-sostegno={isSostegno}
                  >
                    {entry["materia"]}
                  </span>
                {/if}
              </div>

              <!-- Line 2: Secondary info (Materia + Aula/Classe tags, stacked on mobile, side-by-side on tablet/desktop) -->
              {#if (hasPrimary && entry["materia"]) || showClassTag || showAula}
                <div class="line-secondary">
                  {#if showClassTag}
                    <span class="class-tag">{entry["classe"]}</span>
                  {/if}

                  {#if showClassTag && ((hasPrimary && entry["materia"]) || showAula)}
                    <span class="sec-sep" aria-hidden="true">•</span>
                  {/if}

                  {#if hasPrimary && entry["materia"]}
                    <span
                      class="subj-tag"
                      class:is-pot={isPot}
                      class:is-ric={isRic}
                      class:is-sostegno={isSostegno}
                    >
                      {entry["materia"]}
                    </span>
                  {/if}

                  {#if hasPrimary && entry["materia"] && showAula}
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
    left: -1px;
    inset-inline-start: -1px;
    z-index: 2;
    background: var(--brand-surface-card);
    border-right: 1px solid var(--brand-border);
    box-shadow: -2px 0 0 0 var(--brand-surface-card), 2px 0 6px -2px rgba(0, 0, 0, 0.08);
    padding: 0.4rem 0.2rem;
    text-align: center;
    width: calc(52px * var(--table-font-scale, 1));
    min-width: calc(52px * var(--table-font-scale, 1));
    max-width: calc(52px * var(--table-font-scale, 1));
    vertical-align: middle;
  }

  .hour-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .hour-num {
    font-size: calc(1rem * var(--table-font-scale, 1));
    font-weight: 700;
    color: var(--brand-text);
    line-height: 1;
  }

  .hour-time-label {
    display: block;
    font-size: calc(0.74rem * var(--table-font-scale, 1));
    font-weight: 500;
    color: var(--brand-text-muted);
    line-height: 1.1;
    margin-top: 0.15rem;
    white-space: nowrap;
  }

  .day-slot {
    padding: 0.4rem 0.3rem;
    text-align: center;
    vertical-align: middle;
    border-right: 1px solid var(--brand-border);
    transition: background-color 0.15s ease;
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
    gap: 0.22rem;
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
    line-height: 1.25;
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
    font-size: calc(0.925rem * var(--table-font-scale, 1));
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  .teacher-label {
    font-size: calc(0.875rem * var(--table-font-scale, 1));
    font-weight: 700;
  }

  .fallback-subj {
    font-size: calc(0.875rem * var(--table-font-scale, 1));
    font-weight: 700;
  }

  /* Secondary line: Stacked vertically on mobile, row on tablet/desktop */
  .line-secondary {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    margin-top: 0.2rem;
    width: 100%;
  }

  .sec-sep {
    display: none;
  }

  .class-tag {
    font-size: calc(0.8rem * var(--table-font-scale, 1));
    font-weight: 700;
    color: var(--brand-text);
    background: color-mix(in srgb, var(--brand-text) 7%, var(--brand-surface-subtle));
    border: 1px solid var(--brand-border);
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    white-space: nowrap;
    line-height: 1.2;
  }

  .subj-tag {
    font-size: calc(0.8rem * var(--table-font-scale, 1));
    font-weight: 600;
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    background: color-mix(in srgb, var(--brand-primary) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--brand-primary) 22%, transparent);
    color: var(--brand-primary);
    white-space: nowrap;
    line-height: 1.2;
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

  .subj-tag.is-ric {
    background: rgba(236, 72, 153, 0.16);
    color: #be185d;
    border-color: rgba(236, 72, 153, 0.45);
    font-weight: 700;
  }

  :global([data-theme="dark"]) .subj-tag.is-ric,
  :global(.dark) .subj-tag.is-ric {
    color: #f472b6;
    background: rgba(236, 72, 153, 0.22);
    border-color: rgba(236, 72, 153, 0.5);
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
    font-size: calc(0.8rem * var(--table-font-scale, 1));
    font-weight: 600;
    color: #059669;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.25);
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    white-space: nowrap;
    line-height: 1.2;
  }

  .sec-sep {
    font-size: calc(0.775rem * var(--table-font-scale, 1));
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
    font-size: calc(0.9rem * var(--table-font-scale, 1));
    line-height: 1;
  }

  @media (min-width: 640px) {
    .hour-fixed-col {
      width: calc(58px * var(--table-font-scale, 1));
      min-width: calc(58px * var(--table-font-scale, 1));
      max-width: calc(58px * var(--table-font-scale, 1));
      padding: 0.45rem 0.25rem;
    }
    .hour-num {
      font-size: calc(0.9rem * var(--table-font-scale, 1));
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
      font-size: calc(0.875rem * var(--table-font-scale, 1));
      font-weight: 800;
    }
    .teacher-label {
      font-size: calc(0.825rem * var(--table-font-scale, 1));
      font-weight: 700;
    }
    .fallback-subj {
      font-size: calc(0.8rem * var(--table-font-scale, 1));
    }
    .line-secondary {
      display: inline-flex;
      flex-direction: row;
      gap: 0.35rem;
      margin-top: 0.2rem;
      width: auto;
    }
    .class-tag {
      font-size: calc(0.75rem * var(--table-font-scale, 1));
      font-weight: 700;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }
    .subj-tag {
      font-size: calc(0.75rem * var(--table-font-scale, 1));
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }
    .room-sub {
      font-size: calc(0.75rem * var(--table-font-scale, 1));
      font-weight: 700;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }
    .sec-sep {
      display: inline;
      font-size: calc(0.75rem * var(--table-font-scale, 1));
    }
  }

  @media (min-width: 1024px) {
    .hour-fixed-col {
      width: calc(72px * var(--table-font-scale, 1));
      min-width: calc(72px * var(--table-font-scale, 1));
      max-width: calc(72px * var(--table-font-scale, 1));
      padding: 0.6rem 0.35rem;
    }
    .hour-num {
      font-size: calc(1rem * var(--table-font-scale, 1));
    }
    .hour-time-label {
      font-size: calc(0.725rem * var(--table-font-scale, 1));
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
      font-size: calc(0.95rem * var(--table-font-scale, 1));
    }
    .teacher-label {
      font-size: calc(0.875rem * var(--table-font-scale, 1));
    }
    .fallback-subj {
      font-size: calc(0.85rem * var(--table-font-scale, 1));
    }
    .line-secondary {
      gap: 0.4rem;
      margin-top: 0.25rem;
    }
    .class-tag {
      font-size: calc(0.8rem * var(--table-font-scale, 1));
      padding: 0.12rem 0.45rem;
      border-radius: 5px;
    }
    .subj-tag {
      font-size: calc(0.8rem * var(--table-font-scale, 1));
      padding: 0.12rem 0.45rem;
      border-radius: 5px;
    }
    .room-sub {
      font-size: calc(0.8rem * var(--table-font-scale, 1));
      padding: 0.12rem 0.45rem;
      border-radius: 5px;
    }
    .sec-sep {
      font-size: calc(0.8rem * var(--table-font-scale, 1));
    }
    .day-slot:hover {
      background: color-mix(in srgb, var(--brand-primary) 6%, var(--brand-surface-card));
    }
  }
</style>
