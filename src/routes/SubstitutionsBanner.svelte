<script>
  import SwapIcon from "$icons/SwapIcon.svelte";

  export let substitutions = [];
  export let type = "classe";
  export let triggerKey = "";

  let isDismissed = false;
  let prevKey = triggerKey;

  $: if (triggerKey !== prevKey) {
    prevKey = triggerKey;
    isDismissed = false;
  }

  $: count = substitutions.length;
</script>

{#if count > 0 && !isDismissed}
  <aside class="sub-alert" role="status" aria-live="polite">
    <div class="alert-icon-wrap" aria-hidden="true">
      <SwapIcon />
    </div>
    <div class="alert-content">
      <div class="alert-header">
        <span class="alert-title">
          {count === 1 ? "1 ora di sostituzione oggi" : `${count} ore di sostituzione oggi`}
        </span>
      </div>
      <div class="alert-chips">
        {#each substitutions as sub}
          <span class="sub-chip">
            <strong class="sub-chip-hour">{sub.ora}</strong>
            {#if type === "classe"}
              <span class="sub-chip-details">
                {sub.tipologia === "sorveglianza" ? "Sorveglianza" : (sub.docente_abbr || sub.docente || "Docente")}
                {#if sub.docenteOriginale}
                  <span class="sub-chip-orig">(sost. {sub.docenteOriginaleAbbr || sub.docenteOriginale})</span>
                {/if}
              </span>
            {:else if type === "docente"}
              <span class="sub-chip-details">
                {sub.classe ? `Classe ${sub.classe}` : (sub.tipologia === "sorveglianza" ? "Sorveglianza" : "Sostituzione")}
                {#if sub.docenteOriginale}
                  <span class="sub-chip-orig">(sost. {sub.docenteOriginaleAbbr || sub.docenteOriginale})</span>
                {/if}
              </span>
            {:else}
              <span class="sub-chip-details">
                Classe {sub.classe || "—"} • {sub.docente_abbr || sub.docente || "Docente"}
              </span>
            {/if}
          </span>
        {/each}
      </div>
    </div>
    <button
      type="button"
      class="dismiss-btn"
      on:click={() => (isDismissed = true)}
      title="Chiudi avviso"
      aria-label="Chiudi avviso sostituzioni"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </aside>
{/if}

<style>
  .sub-alert {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    background: color-mix(in srgb, #f59e0b 10%, var(--brand-surface-card));
    border: 1px solid color-mix(in srgb, #f59e0b 35%, transparent);
    border-left: 4px solid #f59e0b;
    border-radius: 10px;
    padding: 0.6rem 0.8rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    animation: fade-in 0.2s ease-out;
  }

  .alert-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: rgba(245, 158, 11, 0.18);
    color: #b45309;
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  :global([data-theme="dark"]) .alert-icon-wrap,
  :global(.dark) .alert-icon-wrap {
    color: #fbbf24;
    background: rgba(245, 158, 11, 0.25);
  }

  .alert-content {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex: 1;
    min-width: 0;
  }

  .alert-header {
    display: flex;
    align-items: center;
  }

  .alert-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--brand-text);
    line-height: 1.25;
  }

  .alert-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
  }

  .sub-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.775rem;
    padding: 0.15rem 0.45rem;
    border-radius: 5px;
    background: var(--brand-surface-card);
    border: 1px solid color-mix(in srgb, #f59e0b 30%, transparent);
    color: var(--brand-text);
    line-height: 1.2;
  }

  .sub-chip-hour {
    font-weight: 700;
    color: #b45309;
  }

  :global([data-theme="dark"]) .sub-chip-hour,
  :global(.dark) .sub-chip-hour {
    color: #fbbf24;
  }

  .sub-chip-orig {
    color: var(--brand-text-muted);
    font-style: italic;
    font-size: 0.725rem;
  }

  .dismiss-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--brand-text-muted);
    border-radius: 4px;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s ease, color 0.15s ease;
    padding: 0;
  }

  .dismiss-btn:hover {
    background: color-mix(in srgb, var(--brand-text) 8%, transparent);
    color: var(--brand-text);
  }
</style>
