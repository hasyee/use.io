export type StateHook<T> = {
  (): T | (T | Setter<T>)[];
  origSet?: Setter<T>;
  set?: Setter<T>;
  get: Getter<T>;
  subscribe: Subscriber<T>;
};

export type ComposedHook<T> = StateHook<T> & {
  hookMap: HookMap<T>;
};

export type SelectorHook<T> = StateHook<T> & {
  hookDeps: StateHook<any>[];
};

export type Hook<T> = StateHook<T> | ComposedHook<T> | SelectorHook<T>;

export type Reducer<T> = (state: T) => T;

export type ValueOrReducer<T> = T | Reducer<T>;

export type Listener<T> = (state: T) => any;

export type Getter<T> = () => T;

export type Setter<T> = (valueOrReducer: ValueOrReducer<T>) => T;

export type Updater<T> = (...args: any[]) => T;

export type Unsubscribe = () => void;

export type Subscriber<T> = (listener: Listener<T>) => Unsubscribe;

export type Store<T> = {
  get: Getter<T>;
  subscribe: Subscriber<T>;
  set?: Setter<T>;
  updater?: Updater<T>;
};

export type HookMap<T> = {
  readonly [P in keyof T]: Hook<T[P]>;
};

export type Diff<T> = {
  [K in keyof T]?: T[K];
};

export type UseIOGlobalObject = {
  hooks: HookMap<Object>;
  getState: () => Object;
  getStructuredState: () => Object;
  getAllState: () => Object;
  devTools?: any;
};

declare global {
  interface Window {
    __USE_IO__: UseIOGlobalObject;
  }
}
