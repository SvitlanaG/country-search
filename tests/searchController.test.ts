import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearCountrySearchCache } from '../src/countryRepository';
import {
  createSearchController,
  type SearchState,
} from '../src/searchController';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('search controller error states', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    clearCountrySearchCache();
  });

  it('shows an HTTP error and retries the exact same query', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(503, 'unavailable'))
      .mockResolvedValueOnce(
        jsonResponse(200, [
          { name: 'Italy', capital: 'Rome', region: 'Europe', population: 1 },
        ]),
      );
    vi.stubGlobal('fetch', fetchMock);
    const states: SearchState[] = [];
    const controller = createSearchController((state) => states.push(state), {
      debounceMs: 300,
      timeoutMs: 8_000,
    });

    controller.setQuery('italy');
    await vi.advanceTimersByTimeAsync(300);
    expect(states.at(-1)).toMatchObject({
      kind: 'error',
      query: 'italy',
      error: 'http',
    });

    controller.retry();
    await vi.advanceTimersByTimeAsync(0);
    expect(states.at(-1)).toMatchObject({
      kind: 'results',
      query: 'italy',
      countries: [expect.objectContaining({ name: 'Italy' })],
    });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://countries.dev/name/italy',
      'https://countries.dev/name/italy',
    ]);

    controller.destroy();
  });

  it('shows a timeout separately and ignores AbortError as a user error', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new DOMException('Timed out', 'TimeoutError'))
      .mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));
    vi.stubGlobal('fetch', fetchMock);
    const states: SearchState[] = [];
    const controller = createSearchController((state) => states.push(state), {
      debounceMs: 300,
      timeoutMs: 8_000,
    });

    controller.setQuery('peru');
    await vi.advanceTimersByTimeAsync(300);
    expect(states.at(-1)).toMatchObject({
      kind: 'error',
      query: 'peru',
      error: 'timeout',
    });

    controller.retry();
    await vi.advanceTimersByTimeAsync(0);
    expect(states.at(-1)?.kind).toBe('loading');

    controller.destroy();
  });
});
