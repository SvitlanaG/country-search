import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce } from '../src/debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits for the delay before calling the function', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 250);

    debounced('spain');

    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(249);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledExactlyOnceWith('spain');
  });

  it('resets the timer and calls once with the latest arguments', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 250);

    debounced('sp');
    vi.advanceTimersByTime(200);
    debounced('spain');
    vi.advanceTimersByTime(249);

    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledExactlyOnceWith('spain');
  });
});
