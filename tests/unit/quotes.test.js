import { describe, it, expect } from 'vitest';
import { quotes, getRandomQuote } from '$lib/quotes.js';

describe('quotes module', () => {
  it('contains a rich collection of valid quotes (with role) and curiosities', () => {
    expect(Array.isArray(quotes)).toBe(true);
    expect(quotes.length).toBeGreaterThanOrEqual(110);

    for (const item of quotes) {
      expect(typeof item.text).toBe('string');
      expect(item.text.trim().length).toBeGreaterThan(0);
      expect(typeof item.author).toBe('string');
      expect(item.author.trim().length).toBeGreaterThan(0);

      if (item.type !== 'curiosity') {
        expect(typeof item.role).toBe('string');
        expect(item.role.trim().length).toBeGreaterThan(0);
      }
    }

    const curiosities = quotes.filter((q) => q.type === 'curiosity');
    expect(curiosities.length).toBeGreaterThanOrEqual(40);

    const mathCuriosities = curiosities.filter((q) => q.author === 'Storia della Matematica');
    expect(mathCuriosities.length).toBeGreaterThanOrEqual(14);
  });

  it('returns a valid random quote or curiosity from the collection', () => {
    const quote = getRandomQuote();
    expect(quote).toHaveProperty('text');
    expect(quote).toHaveProperty('author');
    expect(quotes).toContainEqual(quote);
  });

  it('avoids repeating the same item consecutively when called multiple times', () => {
    let previous = getRandomQuote();
    for (let i = 0; i < 30; i++) {
      const next = getRandomQuote(previous);
      expect(next.text).not.toBe(previous.text);
      previous = next;
    }
  });
});
