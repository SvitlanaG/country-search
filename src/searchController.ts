import { debounce } from './debounce';
import { mapCountryResponse, type Country } from './mapCountryResponse';
import { classifyRequestError, type RequestErrorKind } from './requestError';
import { searchCountries } from './searchCountries';

export type SearchState =
  | { kind: 'idle'; query: ''; countries: [] }
  | { kind: 'loading'; query: string; countries: [] }
  | { kind: 'results'; query: string; countries: Country[] }
  | { kind: 'not-found'; query: string; countries: [] }
  | {
      kind: 'error';
      query: string;
      countries: [];
      error: Exclude<RequestErrorKind, 'cancelled'>;
    };

export interface SearchControllerOptions {
  debounceMs?: number;
  timeoutMs?: number;
}

function createTimeoutSignal(timeoutMs: number): {
  signal: AbortSignal;
  dispose: () => void;
} {
  if (typeof AbortSignal.timeout === 'function') {
    return { signal: AbortSignal.timeout(timeoutMs), dispose: () => undefined };
  }

  const timeoutController = new AbortController();
  const timer = setTimeout(
    () =>
      timeoutController.abort(
        new DOMException('Request timed out', 'TimeoutError'),
      ),
    timeoutMs,
  );

  return {
    signal: timeoutController.signal,
    dispose: () => clearTimeout(timer),
  };
}

function combineSignals(signals: AbortSignal[]): AbortSignal {
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any(signals);
  }

  const combined = new AbortController();
  const abortFrom = (source: AbortSignal) => {
    if (!combined.signal.aborted) combined.abort(source.reason);
  };

  for (const signal of signals) {
    if (signal.aborted) {
      abortFrom(signal);
      break;
    }
    signal.addEventListener('abort', () => abortFrom(signal), { once: true });
  }

  return combined.signal;
}

export function createSearchController(
  onState: (state: SearchState) => void,
  options: SearchControllerOptions = {},
) {
  const debounceMs = options.debounceMs ?? 350;
  const timeoutMs = options.timeoutMs ?? 8_000;
  let latestQuery = '';
  let activeController: AbortController | undefined;
  let destroyed = false;

  const scheduleSearch = debounce((query: string) => {
    if (destroyed || query !== latestQuery) return;
    void runSearch(query);
  }, debounceMs);

  function abortActiveRequest(): void {
    const previousController = activeController;
    activeController = undefined;
    previousController?.abort();
  }

  function setQuery(input: string): void {
    latestQuery = input.trim();
    abortActiveRequest();

    if (!latestQuery) {
      onState({ kind: 'idle', query: '', countries: [] });
      return;
    }

    onState({ kind: 'loading', query: latestQuery, countries: [] });
    scheduleSearch(latestQuery);
  }

  async function runSearch(query: string): Promise<void> {
    const requestController = new AbortController();
    activeController = requestController;
    const timeout = createTimeoutSignal(timeoutMs);
    const signal = combineSignals([requestController.signal, timeout.signal]);

    try {
      const rawCountries = await searchCountries(query, signal);

      if (
        destroyed ||
        activeController !== requestController ||
        latestQuery !== query
      ) {
        return;
      }

      const countries = rawCountries.map(mapCountryResponse);
      onState(
        countries.length > 0
          ? { kind: 'results', query, countries }
          : { kind: 'not-found', query, countries: [] },
      );
    } catch (error) {
      if (
        destroyed ||
        activeController !== requestController ||
        latestQuery !== query
      ) {
        return;
      }

      const errorKind = classifyRequestError(error);
      if (errorKind === 'cancelled') return;

      onState({ kind: 'error', query, countries: [], error: errorKind });
    } finally {
      timeout.dispose();
      if (activeController === requestController) activeController = undefined;
    }
  }

  function retry(): void {
    if (!latestQuery || destroyed) return;

    abortActiveRequest();
    onState({ kind: 'loading', query: latestQuery, countries: [] });
    void runSearch(latestQuery);
  }

  function destroy(): void {
    destroyed = true;
    abortActiveRequest();
  }

  return { setQuery, retry, destroy };
}
