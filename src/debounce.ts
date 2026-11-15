export function debounce<Arguments extends unknown[]>(
  callback: (...args: Arguments) => void,
  delay: number,
): (...args: Arguments) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: Arguments) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(...args);
      timeoutId = undefined;
    }, delay);
  };
}
