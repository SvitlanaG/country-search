import { describe, expect, it } from 'vitest';
import { addSearchHistory, loadSearchHistory } from '../src/searchHistory';

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe('search history', () => {
  it('returns an empty history when no value or invalid JSON is stored', () => {
    expect(loadSearchHistory(memoryStorage())).toEqual([]);
    expect(
      loadSearchHistory(
        memoryStorage({ 'country-search-history': '{bad json' }),
      ),
    ).toEqual([]);
  });

  it('puts the latest query first, removes duplicates, and caps the list', () => {
    const storage = memoryStorage();

    addSearchHistory(storage, 'Spain', 3);
    addSearchHistory(storage, 'Japan', 3);
    addSearchHistory(storage, 'France', 3);
    const history = addSearchHistory(storage, 'Spain', 3);

    expect(history).toEqual(['Spain', 'France', 'Japan']);
    expect(loadSearchHistory(storage)).toEqual(history);
  });

  it('ignores blank queries', () => {
    const storage = memoryStorage();

    expect(addSearchHistory(storage, '   ')).toEqual([]);
    expect(loadSearchHistory(storage)).toEqual([]);
  });
});
