export type Reducer<T> = (state: T) => T;

export type ValueOrReducer<T> = T | Reducer<T>;

export type Listener<T> = (state: T) => any;

export type Getter<T> = () => T;

export type Setter<T> = (valueOrReducer: ValueOrReducer<T>) => T;

export type Unsubscribe = () => void;

export type Subscriber<T> = (listener: Listener<T>) => Unsubscribe;

export type Combiner<T, D1, D2> = (...args: DependencyArgs<D1, D2>) => T;

export type ReadonlyStore<T> = {
  get: Getter<T>;
  subscribe: Subscriber<T>;
};

export type Store<T> = ReadonlyStore<T> & {
  set: Setter<T>;
};

export type Composite<T> = Store<T> & {
  assignments: Assignments<T>;
};

export type Selector<T, D1, D2> = ReadonlyStore<T> & {
  dependencies: Dependencies<D1, D2>;
};

export type Assignments<T> = {
  readonly [P in keyof T]: Store<T[P]>;
};

export type Dependencies<D1, D2> = [Store<D1>, Store<D2>?];

export type DependencyArgs<D1, D2> = [D1, D2?];

export type Updater<T> = (...args: any[]) => ValueOrReducer<T>;

export type Update<T, U extends Updater<T>> = (...args: Parameters<U>) => T;

export type StoreHook<T, U = Setter<T>> = (isHook?: boolean) => [T, U];

export type SelectorHook<T> = (isHook?: boolean) => T;

export type Hook<T> = StoreHook<T> | SelectorHook<T>;

export type HookAssignments<T> = {
  readonly [P in keyof T]: StoreHook<T[P], any>;
};

export type HookDependencies<D1, D2> = [Hook<D1>, Hook<D2>?];

export type Diff<T> = {
  [K in keyof T]?: Diff<T[K]>;
};

export function state<T>(initialState: T): StoreHook<T>;
export function state<T, U extends Updater<T>>(initialState: T, updater: U): StoreHook<T, Update<T, typeof updater>>;

export function compose<T>(hookAssignments: HookAssignments<T>): StoreHook<T>;
export function compose<T, U extends Updater<T>>(
  hookAssignments: HookAssignments<T>,
  updater: U
): StoreHook<T, Update<T, typeof updater>>;

export function select<T, D1, D2>(
  combiner: Combiner<T, D1, D2>,
  hookDependencies: HookDependencies<D1, D2>
): SelectorHook<T>;

export function constant<T>(constant: T): T;

export function deepMergeUpdater<T>(diff: Diff<T>): (state: T) => T;

export function shallowMergeUpdater<T>(diff: Diff<T>): (state: T) => T;

export declare const io: {
  state: typeof state;
  compose: typeof compose;
  select: typeof select;
  constant: typeof constant;
  deepMergeUpdater: typeof deepMergeUpdater;
  shallowMergeUpdater: typeof shallowMergeUpdater;
};

export default io;
