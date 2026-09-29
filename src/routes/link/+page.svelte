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
          text: "Accedi all'app WAY Cortese",
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

<div class="link-page">
  <div class="link-card">
    <div class="qr-frame">
      <img src="{base}/qr.png" alt="QR Code WAY Cortese" class="qr-img" />
    </div>

    <div class="actions">
      {#if canShare}
        <button type="button" on:click={share} class="btn btn-primary">Condividi</button>
      {/if}
      <a href="{base}/qr.png" download="QR_WAY_CORTESE.png" class="btn btn-outline" role="button">
        Scarica QR Code
      </a>
    </div>

    <div class="copy-box">
      <input type="text" readonly value={appURL} class="url-input" />
      <button type="button" on:click={copyLink} class="copy-btn" class:copied={showCopied}>
        {showCopied ? "Copiato!" : "Copia link"}
      </button>
    </div>
  </div>
</div>

<style>
  .link-page {
    display: flex;
    justify-content: center;
    padding: 1.5rem 0;
  }

  .link-card {
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 16px;
    padding: 2rem 1.5rem;
    max-width: 380px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  }

  .qr-frame {
    background: white;
    padding: 0.75rem;
    border-radius: 12px;
    border: 1px solid var(--brand-border);
  }

  .qr-img {
    width: 180px;
    height: 180px;
    display: block;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 0.65rem 1rem;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    text-decoration: none;
    border: none;
    box-sizing: border-box;
    margin: 0;
  }

  .btn-primary {
    background: var(--brand-primary);
    color: white;
  }

  .btn-outline {
    background: var(--brand-surface-subtle);
    border: 1.5px solid var(--brand-border);
    color: var(--brand-text);
  }

  .copy-box {
    display: flex;
    border: 1.5px solid var(--brand-border);
    border-radius: 10px;
    overflow: hidden;
    width: 100%;
  }

  .url-input {
    flex: 1;
    background: var(--brand-surface-subtle);
    border: none;
    padding: 0.55rem 0.75rem;
    font-size: 0.8rem;
    color: var(--brand-text);
    outline: none;
    margin: 0;
  }

  .copy-btn {
    padding: 0.55rem 0.85rem;
    background: var(--brand-surface-card);
    border: none;
    border-left: 1px solid var(--brand-border);
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--brand-text);
    cursor: pointer;
    margin: 0;
    white-space: nowrap;
  }

  .copy-btn.copied {
    background: #10b981;
    color: white;
  }
</style>