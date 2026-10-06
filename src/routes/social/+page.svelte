<script>
  import { onMount } from "svelte";

  let copiedSocialId = null;
  let copyTimeout = null;
  let canShare = false;

  const socialChannels = [
    {
      id: "facebook",
      name: "Facebook",
      handle: "@liceoscientificocortese",
      badge: "Avvisi & Novità",
      url: "https://www.facebook.com/liceoscientificocortese/?locale=it_IT",
      description: "Circolari, avvisi ufficiali, iniziative e rassegne delle attività del liceo.",
      themeColor: "#1877F2",
      bgTint: "rgba(24, 119, 242, 0.1)",
      borderTint: "rgba(24, 119, 242, 0.25)",
      textColor: "#1877F2",
      icon: "facebook"
    },
    {
      id: "instagram",
      name: "Instagram",
      handle: "@liceoscientifico_cortese",
      badge: "Foto & Storie",
      url: "https://www.instagram.com/liceoscientifico_cortese/",
      description: "Le storie, i progetti didattici, le gare sportive e i momenti migliori della nostra comunità.",
      themeColor: "#E1306C",
      bgTint: "rgba(225, 48, 108, 0.1)",
      borderTint: "rgba(225, 48, 108, 0.25)",
      textColor: "#E1306C",
      icon: "instagram"
    },
    {
      id: "tiktok",
      name: "TikTok",
      handle: "@liceo_cortese",
      badge: "Video & Trend",
      url: "https://www.tiktok.com/@liceo_cortese",
      description: "Video brevi, interviste, creatività e vita studentesca nei laboratori e nelle classi.",
      themeColor: "#000000",
      bgTint: "rgba(0, 0, 0, 0.08)",
      borderTint: "rgba(0, 0, 0, 0.2)",
      textColor: "var(--brand-text)",
      icon: "tiktok"
    },
    {
      id: "youtube",
      name: "YouTube",
      handle: "Liceo Cortese",
      badge: "Canale Video",
      url: "https://www.youtube.com/channel/UCE8ZbougJxWtb254mrTeO7w",
      description: "Conferenze, registrazioni degli eventi, progetti multimediali e documentari scolastici.",
      themeColor: "#FF0000",
      bgTint: "rgba(255, 0, 0, 0.1)",
      borderTint: "rgba(255, 0, 0, 0.25)",
      textColor: "#FF0000",
      icon: "youtube"
    }
  ];

  onMount(() => {
    canShare = typeof navigator !== "undefined" && !!navigator.share;
  });

  async function copyLink(channel) {
    try {
      await navigator.clipboard.writeText(channel.url);
      copiedSocialId = channel.id;
      if (copyTimeout) clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => {
        copiedSocialId = null;
      }, 2000);
    } catch (e) {
      console.error("Copia fallita", e);
    }
  }

  async function shareChannel(channel) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Liceo Cortese su ${channel.name}`,
          text: `Segui il Liceo Scientifico Nino Cortese su ${channel.name}: ${channel.handle}`,
          url: channel.url
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
  <title>Canali Social - WAY Cortese</title>
</svelte:head>

<div class="social-page">
  <!-- Header Intro Card -->
  <header class="social-intro-card">
    <div class="intro-badge-icon" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 -960 960 960" fill="currentColor">
        <path d="M80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm274-56-23-21q-40-36-67-63t-42-47.5q-15-21-22-38.5t-6-36q0-38 25-63t63-25q21 0 39.5 9t32.5 25q14-16 32.5-25t39.5-9q38 0 63 25t25 63q0 18.5-6 36t-22 38.5q-15 21-42 47.5t-67 63l-23 21ZM160-320v-480 480Z" />
      </svg>
    </div>
    <h1 class="page-title">Canali Social Ufficiali</h1>
    <p class="page-subtitle">
      Segui il <strong>Liceo Scientifico Nino Cortese</strong> sui nostri canali ufficiali per rimanere sempre aggiornato su circolari, eventi, progetti e novità.
    </p>
  </header>

  <!-- Social Cards Grid -->
  <div class="social-grid" role="list" aria-label="Canali social ufficiali del Liceo Cortese">
    {#each socialChannels as item (item.id)}
      <article
        class="social-card {item.id}-card"
        role="listitem"
        style="--channel-color: {item.themeColor}; --channel-bg: {item.bgTint}; --channel-border: {item.borderTint}; --channel-text: {item.textColor};"
      >
        <div class="card-main">
          <!-- Top Row: Icon + Name & Handle + Badge -->
          <div class="card-header">
            <div class="platform-icon-wrap" aria-hidden="true">
              {#if item.icon === "facebook"}
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              {:else if item.icon === "instagram"}
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              {:else if item.icon === "tiktok"}
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.87-4.49V8.78a8.28 8.28 0 0 0 4.9 1.58V6.91a4.84 4.84 0 0 1-1-.22z"/>
                </svg>
              {:else if item.icon === "youtube"}
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
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
            aria-label="Apri canale {item.name} (si apre in una nuova scheda)"
          >
            <span>Apri {item.name}</span>
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
                title="Condividi profilo {item.name}"
                aria-label="Condividi link {item.name}"
                on:click={() => shareChannel(item)}
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
              class:copied={copiedSocialId === item.id}
              title={copiedSocialId === item.id ? "Link copiato!" : "Copia link"}
              aria-label={copiedSocialId === item.id ? "Link copiato negli appunti" : "Copia link di " + item.name}
              on:click={() => copyLink(item)}
            >
              {#if copiedSocialId === item.id}
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

  /* Header Intro Card */
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

  /* Social Grid */
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

  /* Social Card */
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

  .instagram-card .platform-icon-wrap {
    background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%);
    color: #ffffff;
    border: none;
  }

  .tiktok-card .platform-icon-wrap {
    background: #000000;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  :global([data-theme="dark"]) .tiktok-card .platform-icon-wrap {
    background: #111827;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .youtube-card .platform-icon-wrap {
    background: rgba(255, 0, 0, 0.1);
    color: #ff0000;
  }

  .facebook-card .platform-icon-wrap {
    background: rgba(24, 119, 242, 0.1);
    color: #1877f2;
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

  .instagram-card .platform-badge {
    background: rgba(225, 48, 108, 0.12);
    color: #e1306c;
    border-color: rgba(225, 48, 108, 0.25);
  }

  .tiktok-card .platform-badge {
    background: color-mix(in srgb, var(--brand-text) 8%, transparent);
    color: var(--brand-text);
    border-color: var(--brand-border);
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

  /* Actions */
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
    background: var(--brand-primary);
    border-color: var(--brand-primary);
    color: #ffffff;
    text-decoration: none;
  }

  .facebook-card .btn-visit:hover {
    background: #1877f2;
    border-color: #1877f2;
    color: #ffffff;
  }

  .instagram-card .btn-visit:hover {
    background: linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%);
    border-color: #fd1d1d;
    color: #ffffff;
  }

  .tiktok-card .btn-visit:hover {
    background: #000000;
    border-color: #000000;
    color: #ffffff;
  }

  :global([data-theme="dark"]) .tiktok-card .btn-visit:hover {
    background: #1f2937;
    border-color: #374151;
  }

  .youtube-card .btn-visit:hover {
    background: #ff0000;
    border-color: #ff0000;
    color: #ffffff;
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
