import type { RawCountry } from './searchCountries';

export interface Country {
  name: string;
  code: string;
  flag: string;
  emoji: string;
  capital: string;
  region: string;
  subregion: string;
  population: number;
  area: number | null;
  borders: string[];
  languages: string[];
  currency: string;
  nativeName: string;
}

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : undefined;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter((entry): entry is string => typeof entry === 'string');
}

function mapLanguages(value: unknown): string[] {
  const entries = Array.isArray(value)
    ? value
    : Object.values(asRecord(value) ?? {});

  return entries.flatMap((entry) => {
    if (typeof entry === 'string') return [entry];
    const name = readString(asRecord(entry)?.name);
    return name ? [name] : [];
  });
}

function mapCurrency(value: unknown): string {
  const entries = Array.isArray(value)
    ? value
    : Object.values(asRecord(value) ?? {});
  const currency = asRecord(entries[0]);
  const name = readString(currency?.name);
  const symbol = readString(currency?.symbol);

  if (name && symbol) return `${name} (${symbol})`;
  return name || symbol || 'Unknown currency';
}

export function mapCountryResponse(raw: RawCountry): Country {
  const flags = asRecord(raw.flags);
  const flagValue = readString(raw.flag);
  const flagUrl = readString(flags?.svg, readString(flags?.png));
  const flag = flagUrl || flagValue;
  const emoji = flagUrl ? flagValue : flagValue;
  const capital = Array.isArray(raw.capital)
    ? raw.capital
        .filter((item): item is string => typeof item === 'string')
        .join(', ')
    : readString(raw.capital, 'No capital listed');

  return {
    name: readString(raw.name, 'Unknown country'),
    code: readString(raw.alpha3Code, readString(raw.cca3)),
    flag,
    emoji,
    capital: capital || 'No capital listed',
    region: readString(raw.region, 'Unknown region'),
    subregion: readString(raw.subregion),
    population:
      typeof raw.population === 'number' && Number.isFinite(raw.population)
        ? raw.population
        : 0,
    area:
      typeof raw.area === 'number' && Number.isFinite(raw.area)
        ? raw.area
        : null,
    borders: readStrings(raw.borders),
    languages: mapLanguages(raw.languages),
    currency: mapCurrency(raw.currencies),
    nativeName: readString(raw.nativeName),
  };
}
