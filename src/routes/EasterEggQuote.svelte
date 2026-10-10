<script>
  import { getRandomQuote } from "$lib/quotes.js";

  const currentQuote = getRandomQuote();
  $: isCuriosity = currentQuote?.type === "curiosity";
</script>

{#if currentQuote && currentQuote.text}
  <figure class="easteregg-quote">
    <blockquote
      class="easteregg-quote__text"
      class:easteregg-quote__text--curiosity={isCuriosity}
    >
      {#if isCuriosity}
        {currentQuote.text}
      {:else}
        «{currentQuote.text}»
      {/if}
    </blockquote>
    <figcaption class="easteregg-quote__footer">
      <cite class="easteregg-quote__author">
        {isCuriosity ? currentQuote.author : `— ${currentQuote.author}`}
      </cite>
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
    gap: 0.6rem;
  }

  .easteregg-quote__text {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.55;
    font-style: italic;
    color: var(--brand-text);
    text-wrap: balance;
  }

  .easteregg-quote__text--curiosity {
    font-style: normal;
    text-wrap: pretty;
  }

  .easteregg-quote__footer {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .easteregg-quote__author {
    font-style: normal;
    font-size: 0.825rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--brand-primary);
  }

  @media (max-width: 400px) {
    .easteregg-quote {
      padding: 0.85rem 1rem;
      gap: 0.5rem;
    }

    .easteregg-quote__text {
      font-size: 0.875rem;
    }

    .easteregg-quote__author {
      font-size: 0.78rem;
    }
  }
</style>
