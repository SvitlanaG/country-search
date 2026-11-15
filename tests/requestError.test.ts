import { describe, expect, it } from 'vitest';
import { HttpError } from '../src/searchCountries';
import { classifyRequestError } from '../src/requestError';

describe('classifyRequestError', () => {
  it('classifies an AbortError as a user cancellation', () => {
    expect(
      classifyRequestError(new DOMException('Aborted', 'AbortError')),
    ).toBe('cancelled');
  });

  it('classifies a TimeoutError separately from cancellation', () => {
    expect(
      classifyRequestError(new DOMException('Timed out', 'TimeoutError')),
    ).toBe('timeout');
  });

  it('classifies HttpError as an HTTP failure', () => {
    expect(classifyRequestError(new HttpError(503, 'Unavailable'))).toBe(
      'http',
    );
  });

  it('classifies fetch and other unexpected errors as network failures', () => {
    expect(classifyRequestError(new TypeError('Network unavailable'))).toBe(
      'network',
    );
    expect(classifyRequestError('unexpected value')).toBe('network');
  });
});
