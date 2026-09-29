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
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
      <span>Sett.</span>
    </button>
  </div>
</div>

<style>
  .view-switch-wrapper {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin: 0;
  }

  .segmented-control {
    display: inline-flex;
    align-items: center;
    background: var(--brand-surface-subtle);
    border: 1.5px solid var(--brand-border);
    border-radius: 8px;
    padding: 2px;
    gap: 2px;
    box-sizing: border-box;
    min-height: 38px;
  }

  .segment-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
    font-size: 0.775rem;
    font-weight: 600;
    color: var(--brand-text-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
    margin: 0;
    line-height: 1.2;
    white-space: nowrap;
  }

  .segment-btn:hover {
    color: var(--brand-text);
  }

  .segment-btn.active {
    background: var(--brand-surface-card);
    color: var(--brand-primary);
    font-weight: 700;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  }

  @media (min-width: 640px) {
    .segmented-control {
      min-height: 42px;
      border-radius: 10px;
    }
    .segment-btn {
      padding: 0.4rem 0.75rem;
      font-size: 0.825rem;
      border-radius: 8px;
    }
  }
</style>