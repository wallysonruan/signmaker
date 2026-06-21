import { debounce } from '../src/debounce';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('debounce()', () => {
  test('delays invocation until after the wait period', () => {
    const fn = jest.fn();
    const d  = debounce(fn, 200);
    d('a');
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  test('only fires once when called repeatedly within the wait', () => {
    const fn = jest.fn();
    const d  = debounce(fn, 100);
    d('a');
    d('b');
    d('c');
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });

  test('fires again after the wait if called a second time', () => {
    const fn = jest.fn();
    const d  = debounce(fn, 100);
    d('first');
    jest.advanceTimersByTime(100);
    d('second');
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(2, 'second');
  });

  test('cancel() prevents a pending call from firing', () => {
    const fn = jest.fn();
    const d  = debounce(fn, 100);
    d('x');
    d.cancel();
    jest.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });

  test('cancel() is safe to call when idle', () => {
    const fn = jest.fn();
    const d  = debounce(fn, 100);
    expect(() => d.cancel()).not.toThrow();
  });

  test('forwards multiple arguments', () => {
    const fn = jest.fn();
    const d  = debounce(fn, 50);
    d(1, 2, 3);
    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledWith(1, 2, 3);
  });
});
