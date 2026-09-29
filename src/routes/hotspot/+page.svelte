<script>
  import { onDestroy, onMount } from "svelte";
  import { page } from "$app/stores";
  import { hotspot } from "$lib/hotspot.js";
  import { getPrefClassroom, setPrefClassroom } from "$lib/utils.js";
  import ItemSelect from "./../ItemSelect.svelte";

  export let data;
  let selectedClassroom = "";
  let copiedKey = null;
  let copyTimeout;

  $: classrooms = Object.keys(hotspot).map((name) =>
    name.includes("_") ? name.split("_")[0] : name,
  );
  $: classroomHotspot = filterByPrefix(selectedClassroom);

  function filterByPrefix(prefix) {
    return Object.fromEntries(
      Object.entries(hotspot).filter(([key]) => key.startsWith(prefix)),
    );
  }

  function onSelectedItemChange() {
    let queryClass = $page.url.searchParams.get("q");
    if (!queryClass || queryClass !== selectedClassroom) {
      setPrefClassroom(selectedClassroom);
    }
  }

  async function copyCode(key, code) {
    try {
      await navigator.clipboard.writeText(code);
      copiedKey = key;
      clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => {
        copiedKey = null;
      }, 2000);
    } catch (e) {
      console.error("Copia fallita", e);
    }
  }

  onMount(async () => {
    let queryClass = $page.url.searchParams.get("q");
    if (queryClass && data?.aule?.includes(queryClass)) {
      selectedClassroom = queryClass;
    } else {
      selectedClassroom = getPrefClassroom() || classrooms[0] || "";
    }
  });

  onDestroy(() => {
    if (copyTimeout) clearTimeout(copyTimeout);
  });
</script>

<svelte:head>
  <title>Hotspot LIM Aula {selectedClassroom} - WAY Cortese</title>
</svelte:head>

<div class="hotspot-page">
  <div class="toolbar-card">
    <ItemSelect
      label="Aula"
      bind:item={selectedClassroom}
      list={classrooms}
      onChange={onSelectedItemChange}
    />
  </div>

  <div class="results-section">
    <h2 class="section-title">
      <span>Hotspot Aula {selectedClassroom}</span>
      <span class="count-tag">{Object.keys(classroomHotspot).length} trovati</span>
    </h2>

    {#if Object.entries(classroomHotspot).length > 0}
      <div class="hotspots-grid">
        {#each Object.entries(classroomHotspot) as [name, code]}
          <div class="hotspot-card">
            <div class="card-left">
              <div class="wifi-icon-wrap" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                  <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                  <line x1="12" y1="20" x2="12.01" y2="20"></line>
                </svg>
              </div>
              <div class="hotspot-meta">
                <span class="hotspot-name">{name}</span>
                <span class="hotspot-code font-mono">{code}</span>
              </div>
            </div>

            <button
              type="button"
              class="copy-btn"
              class:copied={copiedKey === name}
              on:click={() => copyCode(name, code)}
              aria-label="Copia codice {code}"
            >
              {#if copiedKey === name}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Copiato!</span>
              {:else}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copia</span>
              {/if}
            </button>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-card">
        <p>Nessun codice hotspot registrato per quest'aula.</p>
      </div>
    {/if}
  </div>

  <div class="help-card">
    <div class="help-header">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <h3>Non trovi il codice o ci sono errori?</h3>
    </div>
    <ol class="help-steps">
      <li>Dalla schermata iniziale della LIM seleziona la voce <strong>"Multischermo"</strong> o <strong>"Mirroring"</strong>.</li>
      <li>Controlla il codice a 4 o 6 cifre visualizzato in alto a destra o al centro dello schermo della LIM.</li>
    </ol>
  </div>
</div>

<style>
  .hotspot-page {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    animation: fade-in 0.2s ease-out;
  }

  .toolbar-card {
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 14px;
    padding: 1.15rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    max-width: 400px;
  }

  .results-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0;
    color: var(--brand-text);
  }

  .count-tag {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 9999px;
    background: color-mix(in srgb, var(--brand-primary) 12%, transparent);
    color: var(--brand-primary);
  }

  .hotspots-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.75rem;
  }

  .hotspot-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 12px;
    padding: 0.85rem 1rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    transition: border-color 0.15s ease;
  }

  .hotspot-card:hover {
    border-color: color-mix(in srgb, var(--brand-primary) 35%, var(--brand-border));
  }

  .card-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
  }

  .wifi-icon-wrap {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--brand-primary) 12%, transparent);
    color: var(--brand-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .hotspot-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .hotspot-name {
    font-size: 0.825rem;
    color: var(--brand-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hotspot-code {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--brand-text);
    letter-spacing: 0.05em;
  }

  .copy-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.75rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
    color: var(--brand-text);
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .copy-btn:hover {
    background: var(--brand-primary);
    color: white;
    border-color: var(--brand-primary);
  }

  .copy-btn.copied {
    background: #10b981;
    color: white;
    border-color: #10b981;
  }

  .help-card {
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 14px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .help-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: var(--brand-primary);
  }

  .help-header h3 {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0;
    color: var(--brand-text);
  }

  .help-steps {
    margin: 0;
    padding-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    font-size: 0.85rem;
    color: var(--brand-text-muted);
    line-height: 1.4;
  }

  .empty-card {
    padding: 1.5rem;
    text-align: center;
    background: var(--brand-surface-card);
    border: 1px dashed var(--brand-border);
    border-radius: 12px;
    color: var(--brand-text-muted);
    font-size: 0.9rem;
  }
</style>