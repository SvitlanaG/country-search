import { searchCountries, type RawCountry } from './searchCountries';

interface InFlightSearch {
  controller: AbortController;
  promise: Promise<RawCountry[]>;
  consumers: number;
  settled: boolean;
}

const responseCache = new Map<string, RawCountry[]>();
const inFlightSearches = new Map<string, InFlightSearch>();

function cacheKey(query: string): string {
  return query.trim().toLocaleLowerCase();
}

function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('Request aborted', 'AbortError');
}

function startSearch(key: string, query: string): InFlightSearch {
  const controller = new AbortController();
  const flight: InFlightSearch = {
    controller,
    promise: Promise.resolve([]),
    consumers: 0,
    settled: false,
  };

  flight.promise = searchCountries(query, controller.signal)
    .then((countries) => {
      responseCache.set(key, countries);
      return countries;
    })
    .finally(() => {
      flight.settled = true;
      if (inFlightSearches.get(key) === flight) {
        inFlightSearches.delete(key);
      }
    });

  inFlightSearches.set(key, flight);
  return flight;
}

export function searchCountriesCached(
  query: string,
  signal: AbortSignal,
): Promise<RawCountry[]> {
  if (signal.aborted) return Promise.reject(abortReason(signal));

  const key = cacheKey(query);
  const cachedCountries = responseCache.get(key);
  if (cachedCountries) return Promise.resolve(cachedCountries);

  const flight = inFlightSearches.get(key) ?? startSearch(key, query);
  flight.consumers += 1;

  return new Promise((resolve, reject) => {
    let finished = false;

    const finish = () => {
      if (finished) return false;
      finished = true;
      signal.removeEventListener('abort', onAbort);
      flight.consumers -= 1;
      return true;
    };

    const onAbort = () => {
      if (!finish()) return;
      reject(abortReason(signal));

      if (flight.consumers === 0 && !flight.settled) {
        if (inFlightSearches.get(key) === flight) {
          inFlightSearches.delete(key);
        }
        flight.controller.abort();
      }
    };

    signal.addEventListener('abort', onAbort, { once: true });
    flight.promise.then(
      (countries) => {
        if (finish()) resolve(countries);
      },
      (error: unknown) => {
        if (finish()) reject(error);
      },
    );
  });
}

export function clearCountrySearchCache(): void {
  for (const flight of inFlightSearches.values()) {
    flight.controller.abort();
  }
  inFlightSearches.clear();
  responseCache.clear();
}
