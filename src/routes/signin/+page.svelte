<script>
  import { googleAuth } from "$lib/data.js";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { userEmail } from "$lib/stores.js";
  import { base } from "$app/paths";

  let errorMessage = "";
  let googleButtonContainer;
  let googleButtonReady = false;

  function resetMessages() {
    errorMessage = "";
  }

  async function handleGoogleCredential(response) {
    resetMessages();
    const result = await googleAuth(response.credential);
    if (result.success) {
      goto(`${base}/`);
    } else {
      errorMessage = result.message;
    }
  }

  async function loadGoogleAuth() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      errorMessage =
        "Configurazione mancante: imposta VITE_GOOGLE_CLIENT_ID per abilitare il login con Google.";
      return;
    }

    if (typeof window === "undefined" || !window.google?.accounts?.id) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setupGoogleButton(clientId);
      };
      script.onerror = () => {
        errorMessage = "Impossibile caricare il provider di autenticazione Google.";
      };
      document.head.appendChild(script);
      return;
    }

    setupGoogleButton(clientId);
  }

  function setupGoogleButton(clientId) {
    if (!googleButtonContainer) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredential,
    });

    window.google.accounts.id.renderButton(googleButtonContainer, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: "100%",
    });
    googleButtonReady = true;
  }

  onMount(async () => {
    if ($userEmail) {
      goto(`${base}/`);
      return;
    }
    await loadGoogleAuth();
  });
</script>

<svelte:head>
  <title>Accesso Docenti - WAY Cortese</title>
</svelte:head>

<div class="signin-page">
  {#if !$userEmail}
    <div class="signin-card">
      <div class="signin-header">
        <div class="shield-icon-wrap" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        <h2>Area Riservata Docenti</h2>
        <p class="signin-desc">
          Accedi con l'account scolastico per visualizzare le sostituzioni e ricevere le notifiche.
        </p>
      </div>

      <div class="button-area">
        {#if !googleButtonReady}
          <div class="loading-box">
            <div class="mini-spinner"></div>
            <span>Caricamento Google Sign-In...</span>
          </div>
        {/if}
        <div bind:this={googleButtonContainer} class="google-button-slot"></div>
      </div>

      {#if errorMessage}
        <div class="status-banner error">
          <span>{errorMessage}</span>
        </div>
      {/if}

      <div class="signin-footer">
        <span class="domain-note">
          Richiesto indirizzo istituzionale <strong>@lscortese.com</strong>
        </span>
      </div>
    </div>
  {:else}
    <div class="signin-card">
      <div class="signed-in-box">
        <div class="user-avatar-lg">
          {$userEmail.charAt(0).toUpperCase()}
        </div>
        <h3>Accesso effettuato</h3>
        <p class="signed-email">{$userEmail}</p>
        <a href="{base}/" class="btn-return">Torna all'orario</a>
      </div>
    </div>
  {/if}
</div>

<style>
  .signin-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
    padding: 1.5rem 1rem;
    animation: fade-in 0.2s ease-out;
  }

  .signin-card {
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 16px;
    padding: 2.25rem 1.75rem;
    max-width: 420px;
    width: 100%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }

  .signin-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .shield-icon-wrap {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--brand-primary) 12%, transparent);
    color: var(--brand-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.25rem;
  }

  .signin-header h2 {
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0;
    color: var(--brand-text);
  }

  .signin-desc {
    font-size: 0.875rem;
    color: var(--brand-text-muted);
    margin: 0;
    line-height: 1.45;
  }

  .button-area {
    min-height: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .google-button-slot {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .loading-box {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    color: var(--brand-text-muted);
    font-size: 0.85rem;
  }

  .mini-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--brand-border);
    border-top-color: var(--brand-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .signin-footer {
    padding-top: 1rem;
    border-top: 1px solid var(--brand-border);
    font-size: 0.8rem;
    color: var(--brand-text-muted);
  }

  .domain-note strong {
    color: var(--brand-text);
  }

  .signed-in-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .user-avatar-lg {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background: var(--brand-primary);
    color: white;
    font-size: 1.4rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .signed-in-box h3 {
    margin: 0;
    font-size: 1.2rem;
  }

  .signed-email {
    font-size: 0.9rem;
    color: var(--brand-text-muted);
    margin: 0;
  }

  .btn-return {
    margin-top: 0.75rem;
    display: inline-block;
    padding: 0.65rem 1.25rem;
    border-radius: 10px;
    background: var(--brand-primary);
    color: white;
    font-weight: 600;
    text-decoration: none;
    font-size: 0.9rem;
  }
</style>
