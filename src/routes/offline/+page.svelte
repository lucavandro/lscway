<script>
  import OfflineIconDark from "$lib/images/icons/offline-icon-dark.svg";
  import OfflineIconLight from "$lib/images/icons/offline-icon-light.svg";

  function retry() {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }
</script>

<svelte:head>
  <title>Offline - WAY Cortese</title>
</svelte:head>

<div class="offline-container">
  <div class="offline-card">
    <picture>
      <source srcset={OfflineIconDark} media="(prefers-color-scheme: dark)" />
      <img src={OfflineIconLight} alt="Illustrazione offline" class="offline-img" />
    </picture>
    
    <h2>Sei offline</h2>
    <p class="offline-text">
      Nessuna connessione a Internet disponibile. Puoi continuare a visualizzare gli orari salvati nella cache o riprovare a ricaricare l'app.
    </p>

    <button type="button" on:click={retry} class="retry-btn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="23 4 23 10 17 10"></polyline>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
      </svg>
      <span>Riprova connessione</span>
    </button>
  </div>
</div>

<style>
  .offline-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
    padding: 2rem 1rem;
    animation: fade-in 0.2s ease-out;
  }

  .offline-card {
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 16px;
    padding: 2.5rem 1.5rem;
    max-width: 400px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    gap: 1rem;
  }

  .offline-img {
    width: 140px;
    height: auto;
    margin-bottom: 0.5rem;
  }

  h2 {
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0;
    color: var(--brand-text);
  }

  .offline-text {
    font-size: 0.875rem;
    color: var(--brand-text-muted);
    margin: 0;
    line-height: 1.45;
  }

  .retry-btn {
    margin-top: 0.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.65rem 1.25rem;
    border-radius: 10px;
    background: var(--brand-primary);
    color: white;
    font-size: 0.9rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .retry-btn:hover {
    background: var(--brand-primary-hover);
  }
</style>