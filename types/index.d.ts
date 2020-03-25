export type Reducer<T> = (state: T) => T;

export type ValueOrReducer<T> = T | Reducer<T>;

export type Setter<T> = (valueOrReducer: ValueOrReducer<T>) => T;

export type Subscriber<T> = (nextState: T) => () => void;

export type Combiner<T, D1, D2> = (...args: [D1, D2?]) => T;

export type Action<T> = (...args: any[]) => ValueOrReducer<T>;

export type Actions<T> = {
  readonly [name: string]: Action<T>;
};

export type BoundActions<T, A extends Actions<T>> = {
  readonly [name in keyof A]: (...args: Parameters<A[name]>) => T;
};

export type State<T, A extends Actions<T>> = BoundActions<T, A> & {
  get: () => T;
  set: Setter<T>;
  subscribe: Subscriber<T>;
  isPrimitive: boolean;
  hook: () => StateHook<T, A>;
};

export type Memo<T> = {
  get: () => T;
  subscribe: Subscriber<T>;
  isPrimitive: false;
  hook: () => MemoHook<T>;
};

export type StateHook<T, A extends Actions<T>> = (debugLabel?: string) => [State<T, A>, T];

export type MemoHook<T> = (debugLabel?: string) => [Memo<T>, T];

export type IO<T> = State<T, any> | Memo<T>;

export type Map<T> = {
  readonly [P in keyof T]: State<T[P], any>;
};

export type Deps<D1, D2> = [IO<D1>, IO<D2>?];

export type Diff<T> = {
  readonly [K in keyof T]?: Diff<T[K]>;
};

export function state<T, A extends Actions<T>>(initialState: T, actions?: A): State<T, A>;

export function compose<T, A extends Actions<T>>(map: Map<T>, actions?: A): State<T, A>;

export function memo<T, D1, D2>(combiner: Combiner<T, D1, D2>, deps: Deps<D1, D2>): Memo<T>;

export function deepMergeUpdater<T>(diff: Diff<T>): (state: T) => T;

export function shallowMergeUpdater<T>(diff: Diff<T>): (state: T) => T;

export declare const io: {
  state: typeof state;
  compose: typeof compose;
  memo: typeof memo;
  deepMergeUpdater: typeof deepMergeUpdater;
  shallowMergeUpdater: typeof shallowMergeUpdater;
};

export default io;
