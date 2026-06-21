export interface DebouncedFn<T extends unknown[]> {
    (...args: T): void;
    cancel(): void;
}
export declare function debounce<T extends unknown[]>(fn: (...args: T) => void, delayMs: number): DebouncedFn<T>;
//# sourceMappingURL=debounce.d.ts.map