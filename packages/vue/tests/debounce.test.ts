import { debounce } from '../src/debounce';

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('fires callback after delayMs with correct arguments', () => {
    const fn = jest.fn();
    const d = debounce(fn, 300);

    d('S14c20');
    jest.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('S14c20');
  });

  test('does not fire before delayMs elapses', () => {
    const fn = jest.fn();
    const d = debounce(fn, 300);

    d('S14c20');
    jest.advanceTimersByTime(299);

    expect(fn).not.toHaveBeenCalled();
  });

  test('repeated calls within the window reset the timer and use the last args', () => {
    const fn = jest.fn();
    const d = debounce(fn, 300);

    d('first');
    jest.advanceTimersByTime(200);
    d('second'); // resets timer
    jest.advanceTimersByTime(200); // only 200 ms since last call — should not fire yet
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100); // now 300 ms since last call
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('second');
  });

  test('cancel() prevents the callback from firing', () => {
    const fn = jest.fn();
    const d = debounce(fn, 300);

    d('S14c20');
    d.cancel();
    jest.advanceTimersByTime(300);

    expect(fn).not.toHaveBeenCalled();
  });

  test('cancel() is a no-op when no timer is pending', () => {
    const fn = jest.fn();
    const d = debounce(fn, 300);

    expect(() => d.cancel()).not.toThrow();
  });
});
