<script>
  import { base } from "$app/paths";
  import { onMount } from "svelte";
  import EasterEggQuote from "./EasterEggQuote.svelte";

  export let error = null;
  export let status = 500;

  let imageSrc = `${base}/eastereggs/500.webp`;

  onMount(async () => {
    // Se siamo offline, tenta preventivamente di recuperare il Blob dal Cache Storage
    if (typeof window !== "undefined" && (!navigator.onLine || !imageSrc.startsWith("blob:"))) {
      tryGetBlobFromCache();
    }
  });

  async function tryGetBlobFromCache() {
    if (typeof window === "undefined" || !("caches" in window)) return false;
    try {
      const match =
        (await caches.match(`${base}/eastereggs/500.webp`, { ignoreSearch: true })) ||
        (await caches.match("eastereggs/500.webp", { ignoreSearch: true }));
      if (match) {
        const blob = await match.blob();
        imageSrc = URL.createObjectURL(blob);
        return true;
      }
    } catch (e) {
      console.warn("[Error500] Errore lettura cache:", e);
    }
    return false;
  }

  function retry() {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }

  async function handleImageError(event) {
    const imgEl = event.currentTarget;
    if (imgEl.dataset.fallback === "cache-blob") return;

    // Tentativo 1: recupero diretto come Blob da Cache Storage
    const loadedFromCache = await tryGetBlobFromCache();
    if (loadedFromCache) {
      imgEl.dataset.fallback = "cache-blob";
      return;
    }

    // Tentativo 2: fallback sul path alternativo
    if (!imgEl.dataset.fallback) {
      imgEl.dataset.fallback = "eastereggs";
      imageSrc = `${base}/eastereggs/500.webp`;
    }
  }
</script>

<div class="error-container">
  <div class="error-card">
    <div class="image-wrapper">
      <img
        src={imageSrc}
        alt="Panda al lavoro per risolvere il problema"
        class="error-gif"
        width="280"
        height="280"
        loading="eager"
        decoding="async"
        on:error={handleImageError}
      />
    </div>

    <div class="text-content">
      <h2 class="error-title">Si è verificato un problema</h2>
      <p class="error-subtitle">Un panda altamente addestrato sta cercando di risolverlo.</p>
    </div>

    <EasterEggQuote />

    <div class="error-actions">
      <button type="button" on:click={retry} class="btn btn-primary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        <span>Ricarica la pagina</span>
      </button>

      <a href="{base}/" class="btn btn-secondary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>Torna alla home</span>
      </a>
    </div>

    {#if error?.message && status && status !== 500}
      <div class="error-details">
        <code>{status ? `${status}: ` : ''}{error.message}</code>
      </div>
    {/if}
  </div>
</div>

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

  .image-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 12px;
    overflow: hidden;
  }

  .error-gif {
    width: 240px;
    max-width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
    border-radius: 12px;
    object-fit: contain;
    user-select: none;
    -webkit-user-drag: none;
  }

  .text-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .error-title {
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0;
    color: var(--brand-text);
    line-height: 1.3;
  }

  .error-subtitle {
    font-size: 0.925rem;
    color: var(--brand-text-muted);
    margin: 0;
    line-height: 1.45;
  }

  .error-actions {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    width: 100%;
    margin-top: 0.5rem;
  }

  @media (min-width: 380px) {
    .error-actions {
      flex-direction: row;
      justify-content: center;
    }
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.65rem 1.15rem;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
    border: 1px solid transparent;
  }

  .btn:active {
    transform: scale(0.98);
  }

  .btn-primary {
    background: var(--brand-primary);
    color: #ffffff;
    border-color: var(--brand-primary);
  }

  .btn-primary:hover {
    background: var(--brand-primary-hover);
    border-color: var(--brand-primary-hover);
    color: #ffffff;
  }

  .btn-secondary {
    background: transparent;
    color: var(--brand-text);
    border-color: var(--brand-border);
  }

  .btn-secondary:hover {
    background: var(--brand-surface-subtle);
    border-color: var(--brand-border);
    color: var(--brand-text);
  }

  .error-details {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: var(--brand-text-muted);
  }

  .error-details code {
    background: var(--brand-surface-subtle);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.75rem;
  }

  @media (max-width: 480px) {
    .error-card {
      padding: 2rem 1.25rem;
    }

    .error-gif {
      width: 200px;
    }

    .error-title {
      font-size: 1.2rem;
    }

    .error-subtitle {
      font-size: 0.875rem;
    }
  }
</style>
