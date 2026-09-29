<script>
  export let item;
  export let list = [];
  export let label = "Seleziona";
  export let onChange = function () {};
</script>

<div class="select-wrapper">
  {#if label}
    <label for="select-{label}" class="select-label">
      <span class="label-text">{label}</span>
      <span class="item-count">({list.length})</span>
    </label>
  {/if}
  <div class="select-container">
    <select
      id="select-{label}"
      bind:value={item}
      on:change={onChange}
      class="custom-select"
    >
      {#each list as element}
        <option value={element}>{element}</option>
      {/each}
    </select>
    <div class="select-arrow" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>
  </div>
</div>

<style>
  .select-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    width: 100%;
    margin: 0;
  }

  .select-label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.675rem;
    font-weight: 700;
    color: var(--brand-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0;
    line-height: 1;
  }

  .item-count {
    font-weight: 400;
    opacity: 0.65;
    font-size: 0.65rem;
  }

  .select-container {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
  }

  .custom-select {
    width: 100%;
    min-height: 38px;
    padding: 0.35rem 2rem 0.35rem 0.65rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--brand-text);
    background: var(--brand-surface-card);
    border: 1.5px solid var(--brand-border);
    border-radius: 8px;
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    margin: 0;
    line-height: 1.2;
  }

  @media (min-width: 640px) {
    .custom-select {
      min-height: 42px;
      font-size: 0.95rem;
      padding: 0.45rem 2.25rem 0.45rem 0.75rem;
      border-radius: 10px;
    }
    .select-label {
      font-size: 0.725rem;
    }
  }

  .custom-select:hover {
    border-color: color-mix(in srgb, var(--brand-primary) 50%, var(--brand-border));
  }

  .custom-select:focus {
    outline: none;
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-primary) 20%, transparent);
  }

  .select-arrow {
    position: absolute;
    right: 0.65rem;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brand-text-muted);
    transition: transform 0.15s ease;
  }

  .select-container:focus-within .select-arrow {
    color: var(--brand-primary);
  }
</style>