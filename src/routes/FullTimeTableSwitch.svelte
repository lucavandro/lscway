<script>
  export let control = false;
</script>

<div class="view-switch-wrapper" role="radiogroup" aria-label="Visualizzazione orario">
  <div class="segmented-control">
    <button
      type="button"
      class="segment-btn"
      class:active={!control}
      role="radio"
      aria-checked={!control}
      on:click={() => (control = false)}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      <span>Oggi</span>
    </button>

    <button
      type="button"
      class="segment-btn"
      class:active={control}
      role="radio"
      aria-checked={control}
      on:click={() => (control = true)}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
      <span>Settimana</span>
    </button>
  </div>
</div>

<style>
  .view-switch-wrapper {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 1rem;
  }

  .segmented-control {
    display: inline-flex;
    align-items: center;
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
    border-radius: 10px;
    padding: 3px;
    gap: 2px;
  }

  .segment-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.75rem;
    border-radius: 8px;
    font-size: 0.825rem;
    font-weight: 500;
    color: var(--brand-text-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
    margin: 0;
    line-height: 1.2;
  }

  .segment-btn:hover {
    color: var(--brand-text);
  }

  .segment-btn.active {
    background: var(--brand-surface-card);
    color: var(--brand-primary);
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  @media (max-width: 480px) {
    .view-switch-wrapper {
      justify-content: stretch;
    }
    .segmented-control {
      width: 100%;
    }
    .segment-btn {
      flex: 1;
      justify-content: center;
      padding: 0.45rem 0.5rem;
    }
  }
</style>