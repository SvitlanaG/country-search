export type SearchHistoryStorage = Pick<Storage, 'getItem' | 'setItem'>;

export const SEARCH_HISTORY_KEY = 'country-search-history';
export const SEARCH_HISTORY_LIMIT = 5;

export function loadSearchHistory(storage: SearchHistoryStorage): string[] {
  try {
    const saved: unknown = JSON.parse(
      storage.getItem(SEARCH_HISTORY_KEY) ?? '[]',
    );

    return Array.isArray(saved)
      ? saved.filter(
          (query): query is string =>
            typeof query === 'string' && query.trim().length > 0,
        )
      : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(
  storage: SearchHistoryStorage,
  query: string,
  limit = SEARCH_HISTORY_LIMIT,
): string[] {
  const normalizedQuery = query.trim();
  const previous = loadSearchHistory(storage);
  if (!normalizedQuery) return previous;

  const updated = [
    normalizedQuery,
    ...previous.filter(
      (entry) => entry.toLowerCase() !== normalizedQuery.toLowerCase(),
    ),
  ].slice(0, Math.max(0, limit));

  try {
    storage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // The search itself remains usable when browser storage is unavailable.
  }

  return updated;
}
