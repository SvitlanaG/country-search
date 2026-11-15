import { HttpError } from './searchCountries';

export type RequestErrorKind = 'cancelled' | 'timeout' | 'http' | 'network';

export function classifyRequestError(error: unknown): RequestErrorKind {
  if (error instanceof HttpError) return 'http';

  if (error instanceof Error && error.name === 'AbortError') return 'cancelled';
  if (error instanceof Error && error.name === 'TimeoutError') return 'timeout';

  return 'network';
}
