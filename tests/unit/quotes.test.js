import { describe, it, expect } from 'vitest';
import { quotes, getRandomQuote } from '$lib/quotes.js';

describe('quotes module', () => {
  it('contains a non-empty collection of valid quotes with text and author', () => {
    expect(Array.isArray(quotes)).toBe(true);
    expect(quotes.length).toBeGreaterThanOrEqual(20);

    for (const quote of quotes) {
      expect(typeof quote.text).toBe('string');
      expect(quote.text.trim().length).toBeGreaterThan(0);
      expect(typeof quote.author).toBe('string');
      expect(quote.author.trim().length).toBeGreaterThan(0);
    }
  });

  it('returns a valid random quote from the collection', () => {
    const quote = getRandomQuote();
    expect(quote).toHaveProperty('text');
    expect(quote).toHaveProperty('author');
    expect(quotes).toContainEqual(quote);
  });

  it('avoids repeating the same quote consecutively when called multiple times', () => {
    let previous = getRandomQuote();
    for (let i = 0; i < 30; i++) {
      const next = getRandomQuote(previous);
      expect(next.text).not.toBe(previous.text);
      previous = next;
    }
  });
});
