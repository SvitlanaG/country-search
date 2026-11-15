import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSearchController,
  type SearchState,
} from '../src/searchController';

function countryResponse(name: string): Response {
  return new Response(
    JSON.stringify([
      {
        name,
        capital: 'Capital',
        region: 'Region',
        population: 1,
        flag: '🏳️',
      },
    ]),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

describe('search controller request race', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('aborts the earlier fetch immediately and keeps only the later result', async () => {
    vi.useFakeTimers();
    const signals: AbortSignal[] = [];
    const states: SearchState[] = [];
    let resolveSpain: ((response: Response) => void) | undefined;

    vi.stubGlobal(
      'fetch',
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        const signal = init?.signal as AbortSignal;
        signals.push(signal);

        if (String(_input).endsWith('/spain')) {
          return new Promise<Response>((resolve) => {
            resolveSpain = resolve;
          });
        }

        return new Promise<Response>((_resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => reject(new DOMException('Request aborted', 'AbortError')),
            { once: true },
          );
        });
      }),
    );

    const controller = createSearchController((state) => states.push(state), {
      debounceMs: 300,
      timeoutMs: 10_000,
    });

    controller.setQuery('sp');
    await vi.advanceTimersByTimeAsync(300);
    expect(signals).toHaveLength(1);

    controller.setQuery('spain');
    expect(signals[0]?.aborted).toBe(true);

    await vi.advanceTimersByTimeAsync(300);
    expect(signals).toHaveLength(2);
    resolveSpain?.(countryResponse('Spain'));
    await vi.advanceTimersByTimeAsync(0);

    expect(states.at(-1)).toMatchObject({
      kind: 'results',
      query: 'spain',
      countries: [expect.objectContaining({ name: 'Spain' })],
    });
    expect(states.some((state) => state.kind === 'error')).toBe(false);

    controller.destroy();
  });
});
