<script>
  import { page } from "$app/stores";
  import { base } from "$app/paths";
  import Error500 from "./Error500.svelte";

  $: status = $page.status;
  $: error = $page.error;
  $: is404 = status === 404;
</script>

<svelte:head>
  <title>{is404 ? "Pagina non trovata" : "Errore 500"} - WAY Cortese</title>
</svelte:head>

{#if is404}
  <div class="error-container">
    <div class="error-card">
      <div class="status-badge">404</div>
      <h2 class="error-title">Pagina non trovata</h2>
      <p class="error-subtitle">La pagina che stai cercando non esiste o è stata spostata.</p>
      <div class="error-actions">
        <a href="{base}/" class="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>Torna alla home</span>
        </a>
      </div>
    </div>
  </div>
{:else}
  <Error500 {status} {error} />
{/if}

<style>
  .error-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 65vh;
    padding: 2rem 1rem;
    animation: fade-in 0.25s ease-out;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .error-card {
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 16px;
    padding: 2.5rem 1.75rem;
    max-width: 440px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    gap: 1.25rem;
  }

  .status-badge {
    font-size: 3rem;
    font-weight: 800;
    line-height: 1;
    color: var(--brand-primary);
  }

  .error-title {
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0;
    color: var(--brand-text);
  }

  .error-subtitle {
    font-size: 0.925rem;
    color: var(--brand-text-muted);
    margin: 0;
    line-height: 1.45;
  }

  .error-actions {
    display: flex;
    justify-content: center;
    width: 100%;
    margin-top: 0.5rem;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.65rem 1.25rem;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.15s ease;
    border: 1px solid transparent;
  }

  .btn-primary {
    background: var(--brand-primary);
    color: #ffffff;
  }

  .btn-primary:hover {
    background: var(--brand-primary-hover);
  }
</style>
