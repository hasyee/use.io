export type Reducer<T> = (state: T) => T;

export type ValueOrReducer<T> = T | Reducer<T>;

export type Setter<T> = (valueOrReducer: ValueOrReducer<T>) => T;

export type Combiner<T, D1, D2> = (...args: [D1, D2?]) => T;

export type Updater<T> = (...args: any[]) => ValueOrReducer<T>;

export type Update<T, U extends Updater<T>> = (...args: Parameters<U>) => T;

export type StateHook<T, U = Setter<T>> = (isHook?: boolean) => [T, U];

export type MemoHook<T> = (isHook?: boolean) => T;

export type Hook<T> = StateHook<T> | MemoHook<T>;

export type Assignments<T> = {
  readonly [P in keyof T]: StateHook<T[P], any>;
};

export type Dependencies<D1, D2> = [Hook<D1>, Hook<D2>?];

export type Diff<T> = {
  [K in keyof T]?: Diff<T[K]>;
};

export function state<T>(initialState: T): StateHook<T>;
export function state<T, U extends Updater<T>>(initialState: T, updater: U): StateHook<T, Update<T, typeof updater>>;

export function compose<T>(assignments: Assignments<T>): StateHook<T>;
export function compose<T, U extends Updater<T>>(
  hookAssignments: Assignments<T>,
  updater: U
): StateHook<T, Update<T, typeof updater>>;

export function memo<T, D1, D2>(combiner: Combiner<T, D1, D2>, dependencies: Dependencies<D1, D2>): MemoHook<T>;

export function constant<T>(constant: T): T;

export function deepMergeUpdater<T>(diff: Diff<T>): (state: T) => T;

export function shallowMergeUpdater<T>(diff: Diff<T>): (state: T) => T;

export declare const io: {
  state: typeof state;
  compose: typeof compose;
  memo: typeof memo;
  constant: typeof constant;
  deepMergeUpdater: typeof deepMergeUpdater;
  shallowMergeUpdater: typeof shallowMergeUpdater;
};

export default io;
