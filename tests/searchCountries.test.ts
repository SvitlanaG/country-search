import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, searchCountries } from '../src/searchCountries';

const response = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('searchCountries', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('encodes the query and passes the caller signal to fetch', async () => {
    const country = { name: 'Spain' };
    const signal = new AbortController().signal;
    const fetchMock = vi.fn().mockResolvedValue(response(200, [country]));
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCountries('Trinidad & Tobago', signal)).resolves.toEqual(
      [country],
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://countries.dev/name/Trinidad%20%26%20Tobago',
      { signal },
    );
  });

  it('returns an empty array for a 404 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response(404, 'not found')),
    );

    await expect(
      searchCountries('not-a-country', new AbortController().signal),
    ).resolves.toEqual([]);
  });

  it('throws HttpError with the response status for other HTTP errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response(503, 'unavailable')),
    );

    await expect(
      searchCountries('spain', new AbortController().signal),
    ).rejects.toMatchObject({
      name: 'HttpError',
      status: 503,
    });
  });

  it('exposes HttpError as a reusable error class', () => {
    const error = new HttpError(500, 'server failed');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('HttpError');
    expect(error.status).toBe(500);
  });
});
