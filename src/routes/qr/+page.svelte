<script>
  import { base } from "$app/paths";
  import { onMount } from "svelte";

  let showCopied = false;
  let copyTimeout;
  let canShare = false;

  const appURL = typeof window !== "undefined"
    ? window.location.origin + (base || "") + "/"
    : "https://www.liceoscientificocortese.edu.it/app/way/tmp/";

  onMount(() => {
    canShare = typeof navigator !== "undefined" && !!navigator.share;
  });

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "WAY Cortese",
          text: "Orario scolastico e sostituzioni - Liceo N. Cortese",
          url: appURL,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Errore condivisione:", err);
        }
      }
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(appURL);
      showCopied = true;
      clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => {
        showCopied = false;
      }, 2500);
    } catch (e) {
      console.error("Copia fallita", e);
    }
  }
</script>

<svelte:head>
  <title>Condividi WAY Cortese</title>
</svelte:head>

<div class="qr-page">
  <div class="qr-card">
    <div class="qr-header">
      <div class="qr-badge-icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      </div>
      <h2>Condividi l'App</h2>
      <p class="qr-desc">Inquadra il QR Code con la fotocamera per accedere rapidamente all'orario</p>
    </div>

    <div class="qr-image-frame">
      <img src="{base}/qr.webp" alt="QR Code WAY Cortese" class="qr-image" width="200" height="200" />
    </div>

    <div class="actions-group">
      {#if canShare}
        <button type="button" on:click={share} class="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          <span>Condividi</span>
        </button>
      {/if}

      <a href="{base}/qr.webp" download="QR_WAY_CORTESE.webp" class="btn btn-outline" role="button">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>Scarica</span>
      </a>
    </div>

    <div class="link-field-wrap">
      <label for="share-url" class="field-label">Link applicazione</label>
      <div class="input-with-button">
        <input
          id="share-url"
          type="text"
          readonly
          value={appURL}
          class="url-input"
        />
        <button type="button" on:click={copyLink} class="copy-action-btn" class:copied={showCopied}>
          {#if showCopied}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Copiato!</span>
          {:else}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copia</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .qr-page {
    display: flex;
    justify-content: center;
    padding: 1rem 0;
    animation: fade-in 0.2s ease-out;
  }

  .qr-card {
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 16px;
    padding: 2rem 1.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    max-width: 420px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.5rem;
  }

  .qr-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .qr-badge-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--brand-primary) 12%, transparent);
    color: var(--brand-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.25rem;
  }

  .qr-header h2 {
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0;
    color: var(--brand-text);
  }

  .qr-desc {
    font-size: 0.875rem;
    color: var(--brand-text-muted);
    margin: 0;
    line-height: 1.4;
  }

  .qr-image-frame {
    padding: 1rem;
    background: #ffffff;
    border-radius: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border: 1px solid var(--brand-border);
  }

  .qr-image {
    width: 200px;
    height: 200px;
    display: block;
    object-fit: contain;
  }

  .actions-group {
    display: flex;
    flex-direction: row;
    gap: 0.65rem;
    width: 100%;
  }

  .actions-group .btn {
    flex: 1;
    min-width: 0;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    width: 100%;
    padding: 0.75rem 0.75rem;
    border-radius: 10px;
    font-size: 0.925rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.15s ease;
    box-sizing: border-box;
    border: none;
    margin: 0;
    white-space: nowrap;
  }

  .btn-primary {
    background: var(--brand-primary);
    color: white;
  }

  .btn-primary:hover {
    background: var(--brand-primary-hover);
    color: white;
    text-decoration: none;
  }

  .btn-outline {
    background: var(--brand-surface-subtle);
    border: 1.5px solid var(--brand-border);
    color: var(--brand-text);
  }

  .btn-outline:hover {
    background: var(--brand-surface-card);
    border-color: color-mix(in srgb, var(--brand-primary) 50%, var(--brand-border));
    text-decoration: none;
    color: var(--brand-text);
  }

  .link-field-wrap {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    text-align: left;
  }

  .field-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--brand-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0;
  }

  .input-with-button {
    display: flex;
    align-items: center;
    position: relative;
    border: 1.5px solid var(--brand-border);
    border-radius: 10px;
    background: var(--brand-surface-subtle);
    overflow: hidden;
  }

  .url-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 0.65rem 0.75rem;
    font-size: 0.85rem;
    color: var(--brand-text);
    margin: 0;
    outline: none;
  }

  .copy-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 0.85rem;
    background: var(--brand-surface-card);
    border: none;
    border-left: 1px solid var(--brand-border);
    color: var(--brand-text);
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.15s ease;
    margin: 0;
    white-space: nowrap;
  }

  .copy-action-btn:hover {
    background: var(--brand-primary);
    color: white;
  }

  .copy-action-btn.copied {
    background: #10b981;
    color: white;
  }
</style>
