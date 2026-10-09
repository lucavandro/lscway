<script>
  export let data = [];
  export let fields;
  export let hourIndex;
  import { hours, clockStore } from "$lib/dateutils.js";
  import { inclusioneInFondo } from "$lib/utils.js";
  import { base } from "$app/paths";

  $: currentHour = $clockStore.hourNum;
  $: hour = hours[hourIndex];
  $: rowData = data.filter((e) => e.ora == hour).sort(inclusioneInFondo);
  $: isActive = hourIndex === currentHour - 1;

  function isPotEntry(r) {
    return r?.materia === "POT" || r?.materia === "sub_potenziamento";
  }

  function isRicEntry(r) {
    return r?.materia === "RIC" || r?.materia === "sub_ricevimento";
  }

  $: isTeacherTable = Array.isArray(fields) && fields.includes("classe") && !fields.includes("docente");
  $: isSpannedSpecialRow =
    isTeacherTable &&
    rowData.length > 0 &&
    rowData.every((r) => isPotEntry(r) || isRicEntry(r));
  $: specialRowTypes = isSpannedSpecialRow
    ? Array.from(new Set(rowData.map((r) => (isRicEntry(r) ? "RIC" : "POT"))))
    : [];

  function getFieldEntries(field, rows) {
    if (!rows || rows.length <= 1) return rows;
    const hasSostegno = rows.some((r) => r.materia === "MADISO" || r.materia === "INC");
    if (hasSostegno) {
      if (field === "aula") {
        return [rows[0]];
      }
      if (field === "classe") {
        return [rows[0]];
      }
    }
    return rows;
  }

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
  {:else if isSpannedSpecialRow}
    <td class="data-cell spanned-cell" colspan={fields.length}>
      <div class="cell-entries">
        {#each specialRowTypes as type, index}
          <div class="entry-item">
            <span
              class="subject-tag spanned-tag"
              class:is-pot={type === "POT"}
              class:is-ric={type === "RIC"}
              title={type === "RIC" ? "RICEVIMENTO" : "POTENZIAMENTO"}
            >
              {type === "RIC" ? "RICEVIMENTO" : "POTENZIAMENTO"}
            </span>
          </div>

          {#if index < specialRowTypes.length - 1}
            <div class="entry-divider"></div>
          {/if}
        {/each}
      </div>
    </td>
  {:else}
    {#each fields as field}
      {@const entries = getFieldEntries(field, rowData)}
      <td class="data-cell">
        <div class="cell-entries">
          {#each entries as rd, index}
            <div class="entry-item">
              {#if field === "aula"}
                {#if rd[field] && rd[field] !== "-" && rd["materia"] !== "POT" && rd["materia"] !== "sub_potenziamento" && rd["materia"] !== "RIC" && rd["materia"] !== "sub_ricevimento"}
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
                {#if rd["classe"] && rd["materia"] !== "POT" && rd["materia"] !== "sub_potenziamento"}
                  <a href="{base}/?q={queryValue(rd['classe'])}" class="link-chip class-chip" title="Classe {rd['classe']}">
                    <span>{rd["classe"]}</span>
                  </a>
                {:else if rd["materia"] === "RIC" || rd["materia"] === "sub_ricevimento"}
                  <span class="badge-chip badge-ric">Ricevimento</span>
                {:else if rd["materia"] === "INC" || rd["materia"] === "MADISO"}
                  <span class="badge-chip badge-sostegno">Sostegno</span>
                {:else}
                  <span class="dash">—</span>
                {/if}
              {:else if field === "materia"}
                <span
                  class="subject-tag"
                  class:is-pot={rd[field] === "POT" || rd[field] === "sub_potenziamento"}
                  class:is-ric={rd[field] === "RIC" || rd[field] === "sub_ricevimento"}
                  class:is-sostegno={rd[field] === "MADISO" || rd[field] === "INC"}
                  title={rd[field]}
                >
                  {rd[field]}
                </span>
              {:else}
                <span class="cell-text">{rd[field]}</span>
              {/if}
            </div>

            {#if index < entries.length - 1}
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
    padding: 0.5rem 0.2rem;
    text-align: center;
    border-right: 1px solid var(--brand-border);
    transition: background-color 0.15s ease;
    width: calc(52px * var(--table-font-scale, 1));
    min-width: calc(52px * var(--table-font-scale, 1));
    max-width: calc(56px * var(--table-font-scale, 1));
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
    font-size: calc(1.075rem * var(--table-font-scale, 1));
    font-weight: 700;
    color: var(--brand-text);
  }

  .hour-time {
    font-size: calc(0.775rem * var(--table-font-scale, 1));
    font-weight: 500;
    color: var(--brand-text-muted);
  }

  .now-badge {
    font-size: calc(0.675rem * var(--table-font-scale, 1));
    font-weight: 700;
    text-transform: uppercase;
    background: var(--brand-primary);
    color: #ffffff;
    padding: 0.06rem 0.3rem;
    border-radius: 3px;
    margin-top: 0.1rem;
    line-height: 1.1;
  }

  .data-cell {
    padding: 0.45rem 0.25rem;
    text-align: center;
    vertical-align: middle;
    overflow: hidden;
  }

  .data-cell.spanned-cell {
    padding: 0.45rem 1.25rem;
  }

  .empty-cell {
    padding: 0.45rem 0.25rem;
    text-align: center;
    color: var(--brand-text-muted);
  }

  .dash {
    color: var(--brand-text-muted);
    opacity: 0.35;
    font-size: calc(0.95rem * var(--table-font-scale, 1));
  }

  .cell-entries {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.22rem;
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
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: calc(0.925rem * var(--table-font-scale, 1));
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
    padding: 0.2rem 0.45rem;
    border-radius: 5px;
    font-size: calc(0.875rem * var(--table-font-scale, 1));
    font-weight: 700;
    letter-spacing: 0.02em;
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
    color: var(--brand-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.25;
    box-sizing: border-box;
  }

  .subject-tag.spanned-tag {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 0.28rem 0.85rem;
    border-radius: 6px;
    letter-spacing: 0.05em;
    text-align: center;
  }

  .subject-tag.is-pot {
    background: rgba(245, 158, 11, 0.16);
    color: #b45309;
    border: 1px solid rgba(245, 158, 11, 0.4);
    font-weight: 800;
  }

  :global([data-theme="dark"]) .subject-tag.is-pot,
  :global(.dark) .subject-tag.is-pot {
    color: #fbbf24;
    background: rgba(245, 158, 11, 0.22);
    border-color: rgba(245, 158, 11, 0.5);
  }

  .subject-tag.is-ric {
    background: rgba(236, 72, 153, 0.15);
    color: #be185d;
    border: 1px solid rgba(236, 72, 153, 0.4);
    font-weight: 800;
  }

  :global([data-theme="dark"]) .subject-tag.is-ric,
  :global(.dark) .subject-tag.is-ric {
    color: #f472b6;
    background: rgba(236, 72, 153, 0.22);
    border-color: rgba(236, 72, 153, 0.5);
  }

  .subject-tag.is-sostegno {
    background: rgba(99, 102, 241, 0.12);
    color: #4f46e5;
    border: 1px solid rgba(99, 102, 241, 0.3);
    font-weight: 700;
  }

  :global([data-theme="dark"]) .subject-tag.is-sostegno,
  :global(.dark) .subject-tag.is-sostegno {
    color: #818cf8;
    background: rgba(99, 102, 241, 0.22);
    border-color: rgba(99, 102, 241, 0.45);
  }

  .badge-chip {
    display: inline-block;
    max-width: 100%;
    padding: 0.22rem 0.5rem;
    border-radius: 6px;
    font-size: calc(0.875rem * var(--table-font-scale, 1));
    font-weight: 700;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    box-sizing: border-box;
  }

  .badge-chip.badge-ric {
    background: rgba(236, 72, 153, 0.14);
    color: #be185d;
    border: 1px solid rgba(236, 72, 153, 0.35);
  }

  :global([data-theme="dark"]) .badge-chip.badge-ric,
  :global(.dark) .badge-chip.badge-ric {
    color: #f472b6;
    background: rgba(236, 72, 153, 0.2);
    border-color: rgba(236, 72, 153, 0.45);
  }

  .badge-chip.badge-sostegno {
    background: rgba(99, 102, 241, 0.12);
    color: #4f46e5;
    border: 1px solid rgba(99, 102, 241, 0.3);
  }

  :global([data-theme="dark"]) .badge-chip.badge-sostegno,
  :global(.dark) .badge-chip.badge-sostegno {
    color: #818cf8;
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.45);
  }

  .cell-text {
    font-size: calc(0.925rem * var(--table-font-scale, 1));
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 400px) {
    .hour-cell {
      width: calc(48px * var(--table-font-scale, 1));
      min-width: calc(48px * var(--table-font-scale, 1));
      max-width: calc(52px * var(--table-font-scale, 1));
      padding: 0.4rem 0.15rem;
    }
    .hour-number {
      font-size: calc(1rem * var(--table-font-scale, 1));
    }
    .hour-time {
      font-size: calc(0.725rem * var(--table-font-scale, 1));
    }
    .data-cell {
      padding: 0.38rem 0.15rem;
    }
    .data-cell.spanned-cell {
      padding: 0.38rem 0.9rem;
    }
    .link-chip {
      padding: 0.22rem 0.38rem;
      font-size: calc(0.875rem * var(--table-font-scale, 1));
    }
    .subject-tag {
      padding: 0.18rem 0.35rem;
      font-size: calc(0.825rem * var(--table-font-scale, 1));
    }
  }
</style>
