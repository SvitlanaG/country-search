import { describe, expect, it } from 'vitest';
import { mapCountryResponse } from '../src/mapCountryResponse';

describe('mapCountryResponse', () => {
  it('maps the API response into the app country model', () => {
    const mapped = mapCountryResponse({
      name: 'Spain',
      alpha3Code: 'ESP',
      flag: '🇪🇸',
      flags: { svg: 'https://countries.dev/flags/es.svg' },
      capital: 'Madrid',
      region: 'Europe',
      subregion: 'Southern Europe',
      population: 47351567,
      area: 505990,
      borders: ['AND', 'FRA', 'GIB', 'PRT'],
      languages: [{ iso639_1: 'es', name: 'Spanish' }],
      currencies: [{ code: 'EUR', name: 'Euro', symbol: '€' }],
      nativeName: 'España',
    });

    expect(mapped).toEqual({
      name: 'Spain',
      code: 'ESP',
      flag: 'https://countries.dev/flags/es.svg',
      emoji: '🇪🇸',
      capital: 'Madrid',
      region: 'Europe',
      subregion: 'Southern Europe',
      population: 47351567,
      area: 505990,
      borders: ['AND', 'FRA', 'GIB', 'PRT'],
      languages: ['Spanish'],
      currency: 'Euro (€)',
      nativeName: 'España',
    });
  });

  it('uses safe defaults and supports the legacy object schema', () => {
    const mapped = mapCountryResponse({
      name: 'Nowhere',
      flag: '🏳️',
      capital: ['Example City'],
      languages: { eng: 'English' },
      currencies: { USD: { name: 'US dollar', symbol: '$' } },
    });

    expect(mapped.name).toBe('Nowhere');
    expect(mapped.flag).toBe('🏳️');
    expect(mapped.emoji).toBe('🏳️');
    expect(mapped.capital).toBe('Example City');
    expect(mapped.region).toBe('Unknown region');
    expect(mapped.population).toBe(0);
    expect(mapped.area).toBeNull();
    expect(mapped.borders).toEqual([]);
    expect(mapped.languages).toEqual(['English']);
    expect(mapped.currency).toBe('US dollar ($)');
  });

  it('does not mutate the raw API object', () => {
    const raw = { name: 'France', languages: [{ name: 'French' }] };
    const before = structuredClone(raw);

    mapCountryResponse(raw);

    expect(raw).toEqual(before);
  });
});
