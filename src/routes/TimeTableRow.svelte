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
                  <a href="{base}/aula?q={queryValue(rd[field])}" class="link-chip room-chip">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <span>{rd[field]}</span>
                  </a>
                {:else}
                  <span class="dash">—</span>
                {/if}
              {:else if field === "docente"}
                {#if rd["docente"]}
                  <a href="{base}/docente?q={queryValue(rd['docente'])}" class="link-chip teacher-chip">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>{rd["docente_abbr"] || rd["docente"]}</span>
                  </a>
                {:else}
                  <span class="dash">—</span>
                {/if}
              {:else if field === "classe"}
                {#if rd["classe"]}
                  <a href="{base}/?q={queryValue(rd['classe'])}" class="link-chip class-chip">
                    <span>{rd["classe"]}</span>
                  </a>
                {:else if rd["materia"] === "INC"}
                  <span class="badge-chip badge-amber">Inclusione</span>
                {:else}
                  <span class="dash">—</span>
                {/if}
              {:else if field === "materia"}
                <span class="subject-tag">{rd[field]}</span>
              {:else}
                <span>{rd[field]}</span>
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
    border-left: 4px solid var(--brand-primary);
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
    padding: 0.65rem 0.75rem;
    text-align: center;
    border-right: 1px solid var(--brand-border);
    transition: background-color 0.15s ease;
  }

  .hour-number-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.15rem;
  }

  .hour-number {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--brand-text);
    line-height: 1;
  }

  .hour-time {
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--brand-text-muted);
  }

  .now-badge {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    background: var(--brand-primary);
    color: #ffffff;
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    margin-top: 0.2rem;
  }

  .data-cell {
    padding: 0.65rem 0.85rem;
    text-align: center;
    vertical-align: middle;
  }

  .empty-cell {
    padding: 0.65rem 0.85rem;
    text-align: center;
    color: var(--brand-text-muted);
  }

  .dash {
    color: var(--brand-text-muted);
    opacity: 0.4;
    font-weight: 300;
  }

  .cell-entries {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
  }

  .entry-item {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .entry-divider {
    width: 60%;
    height: 1px;
    background: var(--brand-border);
    margin: 0.2rem auto;
  }

  /* Interactive Chips */
  .link-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.65rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
    transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
    white-space: nowrap;
  }

  .link-chip:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    text-decoration: none;
  }

  .teacher-chip {
    background: color-mix(in srgb, var(--brand-primary) 12%, transparent);
    color: var(--brand-primary);
    border: 1px solid color-mix(in srgb, var(--brand-primary) 25%, transparent);
  }

  .room-chip {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.25);
  }

  .class-chip {
    background: color-mix(in srgb, var(--brand-text) 8%, transparent);
    color: var(--brand-text);
    border: 1px solid var(--brand-border);
  }

  .subject-tag {
    display: inline-block;
    padding: 0.25rem 0.55rem;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
    color: var(--brand-text);
  }
</style>
