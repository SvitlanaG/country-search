export type RawCountry = Record<string, unknown>;

const API_BASE_URL = 'https://countries.dev';

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export async function searchCountries(
  query: string,
  signal: AbortSignal,
): Promise<RawCountry[]> {
  const url = `${API_BASE_URL}/name/${encodeURIComponent(query.trim())}`;
  const response = await fetch(url, { signal });

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new HttpError(
      response.status,
      `Country search failed (${response.status})`,
    );
  }

  const countries: unknown = await response.json();
  if (!Array.isArray(countries)) {
    throw new TypeError('Country search response must be an array');
  }

  return countries as RawCountry[];
}
