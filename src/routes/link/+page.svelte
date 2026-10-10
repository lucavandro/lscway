<script>
  import { onMount } from "svelte";

  let copiedItemId = null;
  let copyTimeout = null;
  let canShare = false;

  const quickLinks = [
    {
      id: "gruppi-mail",
      name: "Indirizzi gruppi mail scolastici",
      handle: "Google Sheets • Elenco contatti",
      badge: "Directory Mail",
      url: "https://docs.google.com/spreadsheets/d/1CHoQed5cFo5ryTkfugP5-4K2jlOuV_RiNbSYj_wD6G4/edit?usp=sharing",
      description:
        "Consulta il foglio aggiornato con gli indirizzi email ufficiali dei gruppi classe, dipartimenti e commissioni.",
      actionLabel: "Apri Indirizzi Mail",
      themeColor: "#10b981",
      bgTint: "rgba(16, 185, 129, 0.1)",
      borderTint: "rgba(16, 185, 129, 0.25)",
      textColor: "#10b981",
      icon: "mail"
    },
    {
      id: "moduli-web",
      name: "Moduli Web 2.0",
      handle: "Google Forms • Modulistica digitale",
      badge: "Modulistica",
      url: "https://forms.gle/UPLBbEKaK56fpDaL6",
      description:
        "Accedi rapidamente ai moduli digitali Web 2.0 e alle richieste online predisposte dall'istituto.",
      actionLabel: "Apri Moduli Web 2.0",
      themeColor: "#7c3aed",
      bgTint: "rgba(124, 58, 237, 0.1)",
      borderTint: "rgba(124, 58, 237, 0.25)",
      textColor: "#7c3aed",
      icon: "forms"
    },
    {
      id: "els-cortese",
      name: "ELS Cortese",
      handle: "liceoscientificocortese.edu.it/els",
      badge: "Portale E-Learning",
      url: "https://www.liceoscientificocortese.edu.it/els/",
      description:
        "Piattaforma didattica e portale online ELS del Liceo Scientifico Statale Nino Cortese.",
      actionLabel: "Apri ELS Cortese",
      themeColor: "#2563eb",
      bgTint: "rgba(37, 99, 235, 0.1)",
      borderTint: "rgba(37, 99, 235, 0.25)",
      textColor: "#2563eb",
      icon: "globe"
    }
  ];

  onMount(() => {
    canShare = typeof navigator !== "undefined" && !!navigator.share;
  });

  async function copyLink(item) {
    try {
      await navigator.clipboard.writeText(item.url);
      copiedItemId = item.id;
      if (copyTimeout) clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => {
        copiedItemId = null;
      }, 2000);
    } catch (e) {
      console.error("Copia fallita", e);
    }
  }

  async function shareItem(item) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${item.name} - Liceo Cortese`,
          text: `${item.name} (${item.handle})`,
          url: item.url
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Errore condivisione:", err);
        }
      }
    }
  }
</script>

<svelte:head>
  <title>Link Rapidi - WAY Cortese</title>
</svelte:head>

<div class="social-page">
  <!-- Header Intro Card -->
  <header class="social-intro-card">
    <div class="intro-badge-icon" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
      </svg>
    </div>
    <h1 class="page-title">Link Rapidi e Risorse</h1>
    <p class="page-subtitle">
      Accedi rapidamente ai portali, agli elenchi email e alle risorse digitali esterne del <strong>Liceo Scientifico Nino Cortese</strong>.
    </p>
  </header>

  <!-- Quick Links Cards Grid -->
  <div class="social-grid" role="list" aria-label="Link rapidi e risorse esterne del Liceo Cortese">
    {#each quickLinks as item (item.id)}
      <article
        class="social-card {item.id}-card"
        role="listitem"
        style="--channel-color: {item.themeColor}; --channel-bg: {item.bgTint}; --channel-border: {item.borderTint}; --channel-text: {item.textColor};"
      >
        <div class="card-main">
          <div class="card-header">
            <div class="platform-icon-wrap" aria-hidden="true">
              {#if item.icon === "mail"}
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
              {:else if item.icon === "forms"}
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <line x1="10" y1="9" x2="8" y2="9"></line>
                </svg>
              {:else if item.icon === "globe"}
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              {/if}
            </div>

            <div class="platform-meta">
              <div class="name-row">
                <span class="platform-name">{item.name}</span>
                <span class="platform-badge">{item.badge}</span>
              </div>
              <span class="platform-handle">{item.handle}</span>
            </div>
          </div>

          <p class="platform-description">{item.description}</p>
        </div>

        <!-- Action Row -->
        <div class="card-actions">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-visit"
            aria-label="Apri {item.name} (si apre in una nuova scheda)"
          >
            <span>{item.actionLabel}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>

          <div class="utility-actions">
            {#if canShare}
              <button
                type="button"
                class="btn-icon"
                title="Condividi {item.name}"
                aria-label="Condividi link {item.name}"
                on:click={() => shareItem(item)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </button>
            {/if}

            <button
              type="button"
              class="btn-icon"
              class:copied={copiedItemId === item.id}
              title={copiedItemId === item.id ? "Link copiato!" : "Copia link"}
              aria-label={copiedItemId === item.id ? "Link copiato negli appunti" : "Copia link di " + item.name}
              on:click={() => copyLink(item)}
            >
              {#if copiedItemId === item.id}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              {:else}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              {/if}
            </button>
          </div>
        </div>
      </article>
    {/each}
  </div>
</div>

<style>
  .social-page {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    animation: fade-in 0.2s ease-out;
    padding-bottom: 1rem;
    width: 100%;
  }

  .social-intro-card {
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 16px;
    padding: 1.5rem 1.25rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  }

  .intro-badge-icon {
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

  .page-title {
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0;
    color: var(--brand-text);
  }

  .page-subtitle {
    font-size: 0.875rem;
    color: var(--brand-text-muted);
    margin: 0;
    max-width: 540px;
    line-height: 1.45;
  }

  .social-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }

  @media (min-width: 640px) {
    .social-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.15rem;
    }

    .social-intro-card {
      padding: 2rem 1.5rem;
    }

    .page-title {
      font-size: 1.5rem;
    }
  }

  .social-card {
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 14px;
    padding: 1.15rem 1.1rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 1.15rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease;
    box-sizing: border-box;
  }

  .social-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    border-color: var(--channel-border);
  }

  .card-main {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .platform-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--channel-bg);
    color: var(--channel-text);
    border: 1px solid var(--channel-border);
    transition: transform 0.2s ease;
  }

  .social-card:hover .platform-icon-wrap {
    transform: scale(1.05);
  }

  .platform-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .name-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .platform-name {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--brand-text);
    line-height: 1.2;
  }

  .platform-badge {
    font-size: 0.675rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 9999px;
    background: var(--channel-bg);
    color: var(--channel-text);
    border: 1px solid var(--channel-border);
    white-space: nowrap;
  }

  .platform-handle {
    font-size: 0.8rem;
    color: var(--brand-text-muted);
    font-weight: 500;
    margin-top: 0.15rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .platform-description {
    font-size: 0.85rem;
    color: var(--brand-text-muted);
    line-height: 1.45;
    margin: 0;
  }

  .card-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-top: 0.65rem;
    border-top: 1px solid var(--brand-border);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    padding: 0.6rem 0.9rem;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;
    margin: 0;
    box-sizing: border-box;
  }

  .btn-visit {
    flex: 1;
    background: var(--brand-surface-subtle);
    border: 1.5px solid var(--brand-border);
    color: var(--brand-text);
  }

  .btn-visit:hover {
    background: var(--channel-color, var(--brand-primary));
    border-color: var(--channel-color, var(--brand-primary));
    color: #ffffff;
    text-decoration: none;
  }

  .utility-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .btn-icon {
    width: 38px;
    height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: var(--brand-surface-subtle);
    border: 1.5px solid var(--brand-border);
    color: var(--brand-text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
    padding: 0;
    margin: 0;
  }

  .btn-icon:hover {
    background: var(--brand-surface-card);
    border-color: var(--brand-primary);
    color: var(--brand-primary);
  }

  .btn-icon.copied {
    background: #10b981;
    border-color: #10b981;
    color: #ffffff;
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
</style>
