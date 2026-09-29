<script>
  import { onMount, onDestroy, tick } from "svelte";

  export let item;
  export let list = [];
  export let label = "Seleziona";
  export let onChange = function () {};

  let isOpen = false;
  let searchQuery = "";
  let highlightedIndex = 0;

  let triggerEl;
  let searchInputDesktop;
  let searchInputMobile;
  let containerEl;
  let nativeSelectEl;

  // Filter list by search query (case-insensitive)
  $: filteredList = searchQuery.trim()
    ? list.filter((el) =>
        String(el).toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : list;

  // Reset highlight index when filtered list changes
  $: if (filteredList) {
    highlightedIndex = 0;
  }

  // Detect mobile viewport (< 640px)
  let isMobile = false;
  function checkMobile() {
    if (typeof window !== "undefined") {
      isMobile = window.innerWidth < 640;
    }
  }

  onMount(() => {
    checkMobile();
    window.addEventListener("resize", checkMobile);
  });

  onDestroy(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", checkMobile);
      document.body.style.overflow = "";
    }
  });

  async function openSelect() {
    isOpen = true;
    searchQuery = "";
    highlightedIndex = Math.max(0, filteredList.indexOf(item));
    if (highlightedIndex === -1) highlightedIndex = 0;

    await tick();

    if (isMobile) {
      document.body.style.overflow = "hidden";
      searchInputMobile?.focus();
    } else {
      searchInputDesktop?.focus();
    }
  }

  function closeSelect() {
    isOpen = false;
    searchQuery = "";
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
    triggerEl?.focus();
  }

  function selectItem(val) {
    item = val;
    closeSelect();

    // Sync native select element in DOM for backward compatibility
    if (nativeSelectEl) {
      nativeSelectEl.value = val;
      nativeSelectEl.dispatchEvent(new Event("change", { bubbles: true }));
    }

    if (typeof onChange === "function") {
      onChange();
    }
  }

  function handleKeydown(e) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        if (document.activeElement === triggerEl) {
          e.preventDefault();
          openSelect();
        }
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      closeSelect();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredList.length > 0) {
        highlightedIndex = (highlightedIndex + 1) % filteredList.length;
        scrollHighlightedIntoView();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredList.length > 0) {
        highlightedIndex = (highlightedIndex - 1 + filteredList.length) % filteredList.length;
        scrollHighlightedIntoView();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredList.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredList.length) {
        selectItem(filteredList[highlightedIndex]);
      }
    }
  }

  function scrollHighlightedIntoView() {
    const highlightedEl = document.querySelector(".option-item.is-highlighted");
    if (highlightedEl && typeof highlightedEl.scrollIntoView === "function") {
      highlightedEl.scrollIntoView({ block: "nearest" });
    }
  }

  // Click outside listener for desktop dropdown
  function handleClickOutside(e) {
    if (isOpen && !isMobile && containerEl && !containerEl.contains(e.target)) {
      closeSelect();
    }
  }

  // Portal action to attach mobile bottom-sheet directly to document.body
  function portal(node) {
    if (typeof document !== "undefined" && node.parentNode !== document.body) {
      document.body.appendChild(node);
    }
    return {
      destroy() {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      },
    };
  }
</script>

<svelte:window on:click={handleClickOutside} on:keydown={handleKeydown} />

<div class="select-wrapper">
  {#if label}
    <label for="select-trigger-{label}" class="select-label">
      <span class="label-text">{label}</span>
      <span class="item-count">({list.length})</span>
    </label>
  {/if}

  <div class="select-container" bind:this={containerEl}>
    <!-- Hidden native select for 100% mobile widget and automated form compatibility -->
    <select
      id="select-{label}"
      bind:this={nativeSelectEl}
      bind:value={item}
      on:change={onChange}
      class="hidden-native-select"
      tabindex="-1"
      aria-hidden="true"
    >
      {#each list as element}
        <option value={element}>{element}</option>
      {/each}
    </select>

    <!-- Custom Select Trigger Button -->
    <button
      type="button"
      id="select-trigger-{label}"
      bind:this={triggerEl}
      class="custom-select-trigger"
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      on:click={() => (isOpen ? closeSelect() : openSelect())}
    >
      <span class="trigger-value" class:is-empty={!item}>
        {item || `Seleziona ${label}`}
      </span>
      <span class="select-arrow" aria-hidden="true" class:arrow-open={isOpen}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </span>
    </button>

    <!-- Option B: Desktop Dropdown (>= 640px) -->
    {#if isOpen && !isMobile}
      <div class="desktop-dropdown" role="listbox" aria-label="Opzioni {label}">
        <div class="search-input-box">
          <span class="search-icon" aria-hidden="true">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            type="text"
            bind:this={searchInputDesktop}
            bind:value={searchQuery}
            placeholder="Cerca {label.toLowerCase()}..."
            class="search-input"
            autocomplete="off"
            spellcheck="false"
          />
          {#if searchQuery}
            <button
              type="button"
              class="clear-btn"
              on:click|stopPropagation={() => {
                searchQuery = "";
                searchInputDesktop?.focus();
              }}
              aria-label="Cancella ricerca"
            >
              ✕
            </button>
          {/if}
        </div>

        <div class="options-scroll-list">
          {#if filteredList.length === 0}
            <div class="empty-results">Nessun risultato per "{searchQuery}"</div>
          {:else}
            {#each filteredList as element, index}
              <button
                type="button"
                role="option"
                aria-selected={element === item}
                class="option-item"
                class:is-selected={element === item}
                class:is-highlighted={index === highlightedIndex}
                on:click={() => selectItem(element)}
                on:mouseenter={() => (highlightedIndex = index)}
              >
                <span class="option-text">{element}</span>
                {#if element === item}
                  <span class="check-icon" aria-hidden="true">✓</span>
                {/if}
              </button>
            {/each}
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Option B: Mobile Bottom Sheet Modal (< 640px) mounted to body -->
{#if isOpen && isMobile}
  <div use:portal class="mobile-sheet-portal">
    <!-- Backdrop covering the viewport -->
    <button
      type="button"
      class="sheet-backdrop"
      on:click={closeSelect}
      aria-label="Chiudi selettore"
    ></button>

    <!-- Bottom Sheet Modal -->
    <div class="mobile-sheet" role="dialog" aria-modal="true" aria-label="Seleziona {label}">
      <!-- Sheet Handle bar -->
      <div class="sheet-handle-wrap" aria-hidden="true">
        <div class="sheet-handle"></div>
      </div>

      <!-- Sheet Header -->
      <div class="sheet-header">
        <div class="sheet-title-wrap">
          <span class="sheet-title">Seleziona {label}</span>
          <span class="sheet-badge">{filteredList.length}</span>
        </div>
        <button
          type="button"
          class="sheet-close-btn"
          on:click={closeSelect}
          aria-label="Chiudi"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Search Input Container -->
      <div class="sheet-search-wrap">
        <div class="search-input-box">
          <span class="search-icon" aria-hidden="true">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            type="text"
            bind:this={searchInputMobile}
            bind:value={searchQuery}
            placeholder="Digita per cercare {label.toLowerCase()}..."
            class="search-input mobile-input"
            autocomplete="off"
            spellcheck="false"
          />
          {#if searchQuery}
            <button
              type="button"
              class="clear-btn"
              on:click|stopPropagation={() => {
                searchQuery = "";
                searchInputMobile?.focus();
              }}
              aria-label="Cancella ricerca"
            >
              ✕
            </button>
          {/if}
        </div>
      </div>

      <!-- Scrollable Options List -->
      <div class="sheet-options-list">
        {#if filteredList.length === 0}
          <div class="empty-results">Nessuna corrispondenza per "{searchQuery}"</div>
        {:else}
          {#each filteredList as element}
            <button
              type="button"
              role="option"
              aria-selected={element === item}
              class="sheet-option-item"
              class:is-selected={element === item}
              on:click={() => selectItem(element)}
            >
              <span class="option-text">{element}</span>
              {#if element === item}
                <span class="sheet-check-icon" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
              {/if}
            </button>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .select-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    width: 100%;
    margin: 0;
    position: relative;
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
  }

  /* Hidden native select for 100% form / mobile widget compatibility */
  .hidden-native-select {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
    pointer-events: none !important;
    opacity: 0 !important;
  }

  /* Custom Trigger Button */
  .custom-select-trigger {
    width: 100%;
    min-height: 38px;
    padding: 0.35rem 2rem 0.35rem 0.65rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--brand-text);
    background: var(--brand-surface-card);
    border: 1.5px solid var(--brand-border);
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    margin: 0;
    line-height: 1.2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-align: left;
    box-sizing: border-box;
  }

  .custom-select-trigger:hover {
    border-color: color-mix(in srgb, var(--brand-primary) 50%, var(--brand-border));
  }

  .custom-select-trigger:focus,
  .custom-select-trigger[aria-expanded="true"] {
    outline: none;
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-primary) 20%, transparent);
  }

  .trigger-value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-right: 0.5rem;
  }

  .trigger-value.is-empty {
    color: var(--brand-text-muted);
  }

  .select-arrow {
    position: absolute;
    right: 0.65rem;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brand-text-muted);
    transition: transform 0.2s ease, color 0.15s ease;
  }

  .select-arrow.arrow-open {
    transform: rotate(180deg);
    color: var(--brand-primary);
  }

  /* ==========================================================================
     Option B: Desktop Dropdown (min-width: 640px)
     ========================================================================== */
  .desktop-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    width: 100%;
    min-width: 250px;
    background: var(--brand-surface-card);
    border: 1.5px solid var(--brand-border);
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
    z-index: 1000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: dropdown-fade-in 0.15s ease-out;
  }

  @keyframes dropdown-fade-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .search-input-box {
    position: relative;
    display: flex;
    align-items: center;
    padding: 0.4rem 0.5rem;
    border-bottom: 1px solid var(--brand-border);
    background: var(--brand-surface-subtle);
  }

  .search-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brand-text-muted);
    margin-right: 0.4rem;
    margin-left: 0.2rem;
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 0.35rem 0.25rem;
    font-size: 0.875rem;
    color: var(--brand-text);
    outline: none;
    box-sizing: border-box;
    width: 100%;
  }

  .search-input:focus {
    outline: none;
    box-shadow: none;
  }

  .clear-btn {
    background: transparent;
    border: none;
    color: var(--brand-text-muted);
    font-size: 0.75rem;
    cursor: pointer;
    padding: 0.25rem 0.4rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .clear-btn:hover {
    color: var(--brand-text);
    background: var(--brand-surface);
  }

  .options-scroll-list {
    max-height: 260px;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0.3rem 0;
  }

  .option-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.45rem 0.75rem;
    background: transparent;
    border: none;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--brand-text);
    cursor: pointer;
    text-align: left;
    transition: background-color 0.1s ease, color 0.1s ease;
    box-sizing: border-box;
    line-height: 1.25;
  }

  .option-item:hover,
  .option-item.is-highlighted {
    background: var(--brand-surface-subtle);
    color: var(--brand-primary);
  }

  .option-item.is-selected {
    background: color-mix(in srgb, var(--brand-primary) 10%, transparent);
    color: var(--brand-primary);
    font-weight: 700;
  }

  .check-icon {
    font-size: 0.85rem;
    color: var(--brand-primary);
    font-weight: 700;
  }

  .empty-results {
    padding: 1.25rem 0.75rem;
    text-align: center;
    font-size: 0.825rem;
    color: var(--brand-text-muted);
  }

  /* ==========================================================================
     Option B: Mobile Bottom Sheet Modal (< 640px)
     ========================================================================== */
  .mobile-sheet-portal {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }

  .sheet-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    border: none;
    padding: 0;
    margin: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    animation: backdrop-fade 0.2s ease-out;
  }

  @keyframes backdrop-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .mobile-sheet {
    position: relative;
    z-index: 2;
    background: var(--brand-surface-card);
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    box-shadow: 0 -4px 28px rgba(0, 0, 0, 0.25);
    max-height: 82dvh;
    min-height: 48dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: sheet-slide-up 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    box-sizing: border-box;
    padding-bottom: env(safe-area-inset-bottom, 0.75rem);
  }

  @keyframes sheet-slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .sheet-handle-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 0.5rem;
    padding-bottom: 0.2rem;
  }

  .sheet-handle {
    width: 40px;
    height: 4.5px;
    background: var(--brand-border);
    border-radius: 9999px;
    opacity: 0.7;
  }

  .sheet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.4rem 1rem 0.65rem;
    border-bottom: 1px solid var(--brand-border);
  }

  .sheet-title-wrap {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sheet-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--brand-text);
  }

  .sheet-badge {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--brand-text-muted);
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
    padding: 0.05rem 0.45rem;
    border-radius: 9999px;
  }

  .sheet-close-btn {
    background: transparent;
    border: none;
    padding: 0.35rem;
    border-radius: 8px;
    color: var(--brand-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .sheet-close-btn:hover,
  .sheet-close-btn:active {
    background: var(--brand-surface-subtle);
    color: var(--brand-text);
  }

  .sheet-search-wrap {
    padding: 0.6rem 0.85rem;
    border-bottom: 1px solid var(--brand-border);
    background: var(--brand-surface-subtle);
  }

  .sheet-search-wrap .search-input-box {
    background: var(--brand-surface-card);
    border: 1.5px solid var(--brand-border);
    border-radius: 10px;
    padding: 0.35rem 0.65rem;
    transition: border-color 0.15s ease;
  }

  .sheet-search-wrap .search-input-box:focus-within {
    border-color: var(--brand-primary);
  }

  /* Font size 16px is MANDATORY to prevent iOS Safari auto-zoom */
  .search-input.mobile-input {
    font-size: 16px;
    min-height: 28px;
    line-height: 1.3;
  }

  .sheet-options-list {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0.35rem 0.5rem;
    -webkit-overflow-scrolling: touch;
  }

  .sheet-option-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 48px; /* Touch target minimum 48px */
    padding: 0.65rem 0.85rem;
    background: transparent;
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--brand-text);
    text-align: left;
    cursor: pointer;
    transition: background-color 0.12s ease;
    box-sizing: border-box;
    margin-bottom: 0.15rem;
  }

  .sheet-option-item:active {
    background: var(--brand-surface-subtle);
  }

  .sheet-option-item.is-selected {
    background: color-mix(in srgb, var(--brand-primary) 12%, transparent);
    color: var(--brand-primary);
    font-weight: 700;
  }

  .sheet-check-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brand-primary);
    flex-shrink: 0;
  }

  @media (min-width: 640px) {
    .custom-select-trigger {
      min-height: 42px;
      font-size: 0.95rem;
      padding: 0.45rem 2.25rem 0.45rem 0.75rem;
      border-radius: 10px;
    }

    .select-label {
      font-size: 0.725rem;
    }
  }
</style>