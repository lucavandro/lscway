<script>
  export let data = [];
  export let fields;
  export let hourIndex;
  import { hours, getHourNum } from "$lib/dateutils.js";
  import { onMount, onDestroy } from "svelte";
  import { inclusioneInFondo } from "$lib/utils.js";
  import { base } from "$app/paths";

  let currentHour = getHourNum();
  let interval;

  $: hour = hours[hourIndex];
  $: rowData = data.filter((e) => e.ora == hour).sort(inclusioneInFondo);
  $: isActive = hourIndex === currentHour - 1;

  onMount(() => {
    interval = setInterval(() => {
      currentHour = getHourNum();
    }, 1000);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });

  const queryValue = (value) => encodeURIComponent(value ?? "");
</script>

<tr class="timetable-row" class:is-active={isActive}>
  <!-- Sticky Hour Header -->
  <th class="hour-cell" scope="row">
    <div class="hour-number-wrap">
      <span class="hour-number">{hourIndex + 1}ª</span>
      <span class="hour-time">{hour}</span>
      {#if isActive}
        <span class="now-badge">Ora</span>
      {/if}
    </div>
  </th>

  {#if rowData.length === 0}
    {#each fields as field}
      <td class="empty-cell">
        <span class="dash">—</span>
      </td>
    {/each}
  {:else}
    {#each fields as field}
      <td class="data-cell">
        <div class="cell-entries">
          {#each rowData as rd, index}
            <div class="entry-item">
              {#if field === "aula"}
                {#if rd[field] && rd[field] !== "-"}
                  <a href="{base}/aula?q={queryValue(rd[field])}" class="link-chip room-chip" title="Aula {rd[field]}">
                    <span>{rd[field]}</span>
                  </a>
                {:else}
                  <span class="dash">—</span>
                {/if}
              {:else if field === "docente"}
                {#if rd["docente"]}
                  <a href="{base}/docente?q={queryValue(rd['docente'])}" class="link-chip teacher-chip" title={rd["docente"]}>
                    <span>{rd["docente_abbr"] || rd["docente"]}</span>
                  </a>
                {:else}
                  <span class="dash">—</span>
                {/if}
              {:else if field === "classe"}
                {#if rd["classe"]}
                  <a href="{base}/?q={queryValue(rd['classe'])}" class="link-chip class-chip" title="Classe {rd['classe']}">
                    <span>{rd["classe"]}</span>
                  </a>
                {:else if rd["materia"] === "INC"}
                  <span class="badge-chip badge-amber">INC</span>
                {:else}
                  <span class="dash">—</span>
                {/if}
              {:else if field === "materia"}
                <span class="subject-tag" title={rd[field]}>{rd[field]}</span>
              {:else}
                <span class="cell-text">{rd[field]}</span>
              {/if}
            </div>

            {#if index < rowData.length - 1}
              <div class="entry-divider"></div>
            {/if}
          {/each}
        </div>
      </td>
    {/each}
  {/if}
</tr>

<style>
  .timetable-row {
    transition: background-color 0.15s ease;
  }

  .timetable-row:not(:last-child) td,
  .timetable-row:not(:last-child) th {
    border-bottom: 1px solid var(--brand-border);
  }

  .timetable-row:hover {
    background-color: var(--brand-surface-subtle);
  }

  /* Active hour highlight */
  .timetable-row.is-active {
    background-color: color-mix(in srgb, var(--brand-primary) 10%, var(--brand-surface-card));
  }

  .timetable-row.is-active .hour-cell {
    border-left: 3px solid var(--brand-primary);
    background-color: color-mix(in srgb, var(--brand-primary) 12%, var(--brand-surface-card));
  }

  .timetable-row.is-active .hour-number {
    color: var(--brand-primary);
  }

  .hour-cell {
    position: sticky;
    inset-inline-start: 0;
    z-index: 2;
    background: var(--brand-surface-card);
    padding: 0.4rem 0.2rem;
    text-align: center;
    border-right: 1px solid var(--brand-border);
    transition: background-color 0.15s ease;
    width: 44px;
    min-width: 44px;
    max-width: 48px;
    vertical-align: middle;
  }

  .hour-number-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;
    line-height: 1.1;
  }

  .hour-number {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--brand-text);
  }

  .hour-time {
    font-size: 0.65rem;
    font-weight: 500;
    color: var(--brand-text-muted);
  }

  .now-badge {
    font-size: 0.575rem;
    font-weight: 700;
    text-transform: uppercase;
    background: var(--brand-primary);
    color: #ffffff;
    padding: 0.05rem 0.25rem;
    border-radius: 3px;
    margin-top: 0.1rem;
    line-height: 1.1;
  }

  .data-cell {
    padding: 0.35rem 0.25rem;
    text-align: center;
    vertical-align: middle;
    overflow: hidden;
  }

  .empty-cell {
    padding: 0.35rem 0.25rem;
    text-align: center;
    color: var(--brand-text-muted);
  }

  .dash {
    color: var(--brand-text-muted);
    opacity: 0.35;
    font-size: 0.85rem;
  }

  .cell-entries {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    width: 100%;
  }

  .entry-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-width: 0;
  }

  .entry-divider {
    width: 60%;
    height: 1px;
    background: var(--brand-border);
    margin: 0.1rem auto;
  }

  /* Compact Chips */
  .link-chip {
    display: inline-block;
    max-width: 100%;
    padding: 0.2rem 0.4rem;
    border-radius: 6px;
    font-size: 0.775rem;
    font-weight: 600;
    text-decoration: none;
    transition: transform 0.12s ease, background 0.12s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.25;
    box-sizing: border-box;
  }

  .link-chip:hover {
    text-decoration: none;
    transform: translateY(-1px);
  }

  .teacher-chip {
    background: color-mix(in srgb, var(--brand-primary) 10%, transparent);
    color: var(--brand-primary);
    border: 1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent);
  }

  .room-chip {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  .class-chip {
    background: color-mix(in srgb, var(--brand-text) 6%, transparent);
    color: var(--brand-text);
    border: 1px solid var(--brand-border);
  }

  .subject-tag {
    display: inline-block;
    max-width: 100%;
    padding: 0.15rem 0.35rem;
    border-radius: 4px;
    font-size: 0.725rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
    color: var(--brand-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.25;
  }

  .cell-text {
    font-size: 0.775rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 400px) {
    .hour-cell {
      width: 40px;
      min-width: 40px;
      padding: 0.35rem 0.15rem;
    }
    .hour-number {
      font-size: 0.85rem;
    }
    .hour-time {
      font-size: 0.6rem;
    }
    .data-cell {
      padding: 0.3rem 0.15rem;
    }
    .link-chip {
      padding: 0.18rem 0.3rem;
      font-size: 0.725rem;
    }
    .subject-tag {
      padding: 0.12rem 0.25rem;
      font-size: 0.675rem;
    }
  }
</style>
