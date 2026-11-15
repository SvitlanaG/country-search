import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearCountrySearchCache,
  searchCountriesCached,
} from '../src/countryRepository';

const countryResponse = new Response(JSON.stringify([{ name: 'Spain' }]), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
});

describe('cached country repository', () => {
  afterEach(() => {
    clearCountrySearchCache();
    vi.unstubAllGlobals();
  });

  it('reuses a successful result for the same query', async () => {
    const fetchMock = vi.fn().mockResolvedValue(countryResponse.clone());
    vi.stubGlobal('fetch', fetchMock);
    const firstSignal = new AbortController().signal;
    const secondSignal = new AbortController().signal;

    await searchCountriesCached('Spain', firstSignal);
    await searchCountriesCached('Spain', secondSignal);

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('deduplicates in-flight requests without sharing caller cancellation', async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    let networkSignal: AbortSignal | undefined;
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      networkSignal = init?.signal as AbortSignal;
      return new Promise<Response>((resolve, reject) => {
        resolveResponse = resolve;
        networkSignal?.addEventListener(
          'abort',
          () =>
            reject(new DOMException('Network request aborted', 'AbortError')),
          { once: true },
        );
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const firstCaller = new AbortController();
    const secondCaller = new AbortController();
    const firstResult = searchCountriesCached('japan', firstCaller.signal);
    const secondResult = searchCountriesCached('japan', secondCaller.signal);

    firstCaller.abort();
    expect(networkSignal?.aborted).toBe(false);
    resolveResponse?.(countryResponse.clone());

    await expect(firstResult).rejects.toMatchObject({ name: 'AbortError' });
    await expect(secondResult).resolves.toEqual([{ name: 'Spain' }]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
