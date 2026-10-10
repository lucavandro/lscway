<script>
  import { getRandomQuote, getRandomOtherCategories } from "$lib/quotes.js";

  let currentQuote = getRandomQuote();
  let otherCategories = getRandomOtherCategories(currentQuote?.category, 2);
  let isAnimating = false;

  $: isCuriosity = currentQuote?.type === "curiosity";

  function selectCategory(category) {
    isAnimating = true;
    currentQuote = getRandomQuote(currentQuote, category);
    otherCategories = getRandomOtherCategories(currentQuote?.category, 2);
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
      <div class="easteregg-quote__actions" role="group" aria-label="Cambia citazione o categoria">
        <button
          type="button"
          class="easteregg-quote__btn easteregg-quote__refresh"
          on:click={() => selectCategory(currentQuote.category)}
          aria-label="Altra voce della categoria {currentQuote.category}"
          title="Mostra un'altra voce della categoria {currentQuote.category}"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          <span>{currentQuote.category}</span>
        </button>
        {#each otherCategories as cat (cat)}
          <button
            type="button"
            class="easteregg-quote__btn easteregg-quote__category-btn"
            on:click={() => selectCategory(cat)}
            aria-label="Passa alla categoria {cat}"
            title="Mostra una voce della categoria {cat}"
          >
            <span>{cat}</span>
          </button>
        {/each}
      </div>
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
    gap: 0.55rem;
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

  .easteregg-quote__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    width: 100%;
  }

  .easteregg-quote__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.32rem;
    padding: 0.3rem 0.68rem;
    border-radius: 9999px;
    font-family: inherit;
    font-size: 0.74rem;
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
    transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }

  .easteregg-quote__refresh {
    color: var(--brand-primary);
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
  }

  .easteregg-quote__category-btn {
    color: var(--brand-text-muted);
    background: transparent;
    border: 1px solid var(--brand-border);
  }

  .easteregg-quote__btn:hover {
    color: var(--brand-primary);
    background: var(--brand-surface-card);
    border-color: var(--brand-primary);
  }

  .easteregg-quote__btn:active {
    transform: scale(0.96);
  }

  .easteregg-quote__refresh:active svg {
    transform: rotate(45deg);
  }

  @media (prefers-reduced-motion: reduce) {
    .easteregg-quote__text,
    .easteregg-quote__btn {
      transition: none;
    }
    .easteregg-quote__btn:active,
    .easteregg-quote__refresh:active svg {
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

    .easteregg-quote__btn {
      font-size: 0.7rem;
      padding: 0.26rem 0.58rem;
    }
  }
</style>

