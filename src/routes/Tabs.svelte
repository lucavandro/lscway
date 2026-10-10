<script>
  import { page } from "$app/stores";
  import { base } from "$app/paths";
  import { isTeacher } from "$lib/stores.js";

  $: currentPath = $page.url.pathname;
  $: isHome = currentPath === base || currentPath === base + "/";
  $: isDocente = currentPath === base + "/docente";
  $: isAula = currentPath === base + "/aula";
  $: isSostituzioni = currentPath === base + "/sostituzioni";

  $: showTabs = isHome || isDocente || isAula || isSostituzioni;
</script>

{#if showTabs}
  <nav class="tabs-nav" aria-label="Sezioni orario" data-sveltekit-preload-code="viewport">
    <div class="tabs-tray" role="tablist">
      <a
        href="{base}/"
        class="tab-pill"
        class:active={isHome}
        role="tab"
        aria-selected={isHome}
      >
        Classe
      </a>

      <a
        href="{base}/docente"
        class="tab-pill"
        class:active={isDocente}
        role="tab"
        aria-selected={isDocente}
      >
        Docente
      </a>

      <a
        href="{base}/aula"
        class="tab-pill"
        class:active={isAula}
        role="tab"
        aria-selected={isAula}
      >
        Aula
      </a>

      {#if $isTeacher}
        <a
          href="{base}/sostituzioni"
          class="tab-pill"
          class:active={isSostituzioni}
          role="tab"
          aria-selected={isSostituzioni}
        >
          Sostituzioni
        </a>
      {/if}
    </div>
  </nav>
{/if}

<style>
  .tabs-nav {
    display: flex;
    justify-content: center;
    padding: 0.25rem 0 0.5rem;
    width: 100%;
  }

  .tabs-tray {
    display: flex;
    align-items: center;
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
    border-radius: 9999px;
    padding: 3px;
    width: 100%;
    max-width: 480px;
    gap: 3px;
  }

  .tab-pill {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0.5rem 0.7rem;
    border-radius: 9999px;
    font-size: 0.975rem;
    font-weight: 500;
    color: var(--brand-text-muted);
    text-decoration: none;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    white-space: nowrap;
    border: none;
    cursor: pointer;
  }

  .tab-pill:hover {
    color: var(--brand-text);
    text-decoration: none;
  }

  .tab-pill.active {
    background: var(--brand-surface-card);
    color: var(--brand-primary);
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  @media (max-width: 400px) {
    .tab-pill {
      font-size: 0.925rem;
      padding: 0.42rem 0.5rem;
    }
  }
</style>
