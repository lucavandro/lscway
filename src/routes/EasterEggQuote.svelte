<script>
  import { getRandomQuote } from "$lib/quotes.js";

  let currentQuote = getRandomQuote();
  let isAnimating = false;

  $: isCuriosity = currentQuote?.type === "curiosity";

  function nextQuote() {
    isAnimating = true;
    currentQuote = getRandomQuote(currentQuote);
    setTimeout(() => {
      isAnimating = false;
    }, 200);
  }
</script>

{#if currentQuote && currentQuote.text}
  <figure class="easteregg-quote" aria-live="polite">
    {#if isCuriosity}
      <p class="easteregg-quote__title">Lo sapevi?</p>
    {/if}
    <blockquote
      class="easteregg-quote__text"
      class:easteregg-quote__text--curiosity={isCuriosity}
      class:is-animating={isAnimating}
    >
      {#if isCuriosity}
        {currentQuote.text}
      {:else}
        «{currentQuote.text}»
      {/if}
    </blockquote>
    <figcaption class="easteregg-quote__footer">
      <cite class="easteregg-quote__author">
        {#if isCuriosity}
          {currentQuote.author}
        {:else}
          — {currentQuote.author}{#if currentQuote.role}<span class="easteregg-quote__role">, {currentQuote.role}</span>{/if}
        {/if}
      </cite>
      <button
        type="button"
        class="easteregg-quote__refresh"
        on:click={nextQuote}
        aria-label="Mostra un'altra citazione o curiosità"
        title="Mostra un'altra citazione o curiosità"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
      </button>
    </figcaption>
  </figure>
{/if}

<style>
  .easteregg-quote {
    margin: 0;
    padding: 1rem 1.25rem;
    max-width: 34rem;
    width: 100%;
    border-radius: 12px;
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.5rem;
    transition: border-color 0.2s ease, background-color 0.2s ease;
  }

  .easteregg-quote__title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1.3;
    color: var(--brand-primary);
  }

  .easteregg-quote__text {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.55;
    font-style: italic;
    color: var(--brand-text);
    text-wrap: balance;
    transition: opacity 0.18s ease;
  }

  .easteregg-quote__text--curiosity {
    font-style: normal;
    text-wrap: pretty;
  }

  .easteregg-quote__text.is-animating {
    opacity: 0.65;
  }

  .easteregg-quote__footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    width: 100%;
  }

  .easteregg-quote__author {
    font-style: normal;
    font-size: 0.825rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--brand-primary);
  }

  .easteregg-quote__role {
    font-weight: 500;
    color: var(--brand-text-muted);
  }

  .easteregg-quote__refresh {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 9999px;
    color: var(--brand-text-muted);
    background: transparent;
    border: 1px solid transparent;
    cursor: pointer;
    transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }

  .easteregg-quote__refresh:hover {
    color: var(--brand-primary);
    background: var(--brand-surface-card);
    border-color: var(--brand-border);
  }

  .easteregg-quote__refresh:active {
    transform: rotate(45deg) scale(0.95);
  }

  @media (prefers-reduced-motion: reduce) {
    .easteregg-quote__text,
    .easteregg-quote__refresh {
      transition: none;
    }
    .easteregg-quote__refresh:active {
      transform: none;
    }
  }

  @media (max-width: 400px) {
    .easteregg-quote {
      padding: 0.85rem 1rem;
      gap: 0.45rem;
    }

    .easteregg-quote__title {
      font-size: 0.96rem;
    }

    .easteregg-quote__text {
      font-size: 0.875rem;
    }

    .easteregg-quote__author {
      font-size: 0.78rem;
    }
  }
</style>
