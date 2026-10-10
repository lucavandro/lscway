import { describe, it, expect } from 'vitest';
import {
  quotes,
  QUOTE_CATEGORIES,
  getRandomQuote,
  getRandomOtherCategories
} from '$lib/quotes.js';

describe('quotes module', () => {
  it('contains a rich collection of valid quotes (with role and category) and curiosities', () => {
    expect(Array.isArray(quotes)).toBe(true);
    expect(quotes.length).toBeGreaterThanOrEqual(110);
    expect(QUOTE_CATEGORIES.length).toBe(7);

    for (const item of quotes) {
      expect(typeof item.text).toBe('string');
      expect(item.text.trim().length).toBeGreaterThan(0);
      expect(typeof item.author).toBe('string');
      expect(item.author.trim().length).toBeGreaterThan(0);
      expect(QUOTE_CATEGORIES).toContain(item.category);

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
    expect(quote).toHaveProperty('category');
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

  it('filters by category when a category is passed to getRandomQuote', () => {
    for (const category of QUOTE_CATEGORIES) {
      let prev = getRandomQuote(null, category);
      expect(prev.category).toBe(category);
      const next = getRandomQuote(prev, category);
      expect(next.category).toBe(category);
      expect(next.text).not.toBe(prev.text);
    }
  });

  it('returns two distinct random categories different from the current category', () => {
    for (const currentCategory of QUOTE_CATEGORIES) {
      const others = getRandomOtherCategories(currentCategory, 2);
      expect(others).toHaveLength(2);
      expect(others[0]).not.toBe(currentCategory);
      expect(others[1]).not.toBe(currentCategory);
      expect(others[0]).not.toBe(others[1]);
      expect(QUOTE_CATEGORIES).toContain(others[0]);
      expect(QUOTE_CATEGORIES).toContain(others[1]);
    }
  });
});

