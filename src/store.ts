/** TYPES **/

export type Reducer<T> = (state: T) => T;

export type ValueOrReducer<T> = T | Reducer<T>;

export type Listener<T> = (state: T) => any;

export type Getter<T> = () => T;

export type Setter<T> = (valueOrReducer: ValueOrReducer<T>) => T;

export type Updater<T> = <A>(...args: A[]) => T;

export type Unsubscribe = () => void;

export type Subscriber<T> = (listener: Listener<T>) => Unsubscribe;

export type Combiner<T, D1, D2> = (...args: DependencyArgs<D1, D2>) => T;

export type ReadonlyStore<T> = {
  get: Getter<T>;
  subscribe: Subscriber<T>;
};

export type Store<T> = ReadonlyStore<T> & {
  set?: Setter<T>;
  update?: Updater<T>;
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

/** SYMBOL **/

const IO = Symbol('IO');

/** FUNCTIONS **/

const isReducer = <T>(valueOrReducer: ValueOrReducer<T>): valueOrReducer is Reducer<T> =>
  typeof valueOrReducer === 'function';

const createStore = <T>(initialState: T, update?: Updater<T>): Store<T> => {
  let state = initialState;
  const listeners = new Set<Listener<T>>();

  const get: Getter<T> = () => state;

  const set: Setter<T> = valueOrReducer => {
    const nextState = isReducer(valueOrReducer) ? valueOrReducer(state) : valueOrReducer;
    if (state !== nextState) {
      state = nextState;
      listeners.forEach(listener => listener(state));
    }
    return state;
  };

  const subscribe: Subscriber<T> = listener => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return update ? { get, set, update, subscribe } : { get, set, subscribe };
};

const createCompositeStore = <T>(assignments: Assignments<T>, update?: Updater<T>): Composite<T> => {
  let blockListening = false;

  const get: Getter<T> = () =>
    Object.keys(assignments).reduce((acc, key) => ({ ...acc, [key]: assignments[key].get() }), {} as T);

  const set: Setter<T> = valueOrReducer => {
    const nextState = isReducer(valueOrReducer) ? valueOrReducer(get()) : valueOrReducer;
    const lastModifiedIndex = Object.keys(assignments).reduce(
      (lastIndex, key, index) => (assignments[key].get() !== nextState[key] ? index : lastIndex),
      -1
    );
    if (lastModifiedIndex === -1) return nextState;
    blockListening = true;
    Object.keys(assignments).forEach((key, i) => {
      if (i === lastModifiedIndex) blockListening = false;
      assignments[key].set(nextState[key]);
    });
    return nextState;
  };

  const subscribe: Subscriber<T> = listener => {
    const unsubscribes = Object.keys(assignments).map(key =>
      assignments[key].subscribe(() => !blockListening && listener(get()))
    );
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  };

  return update ? { get, set, update, subscribe, assignments } : { get, set, subscribe, assignments };
};

const createSelectorStore = <T, D1, D2>(
  combiner: Combiner<T, D1, D2>,
  dependencies: Dependencies<D1, D2>
): Selector<T, D1, D2> => {
  let prevValues: DependencyArgs<D1, D2>;

  const get: Getter<T> = () => {
    const values = dependencies.map(store => store!.get()) as DependencyArgs<D1, D2>;
    const value = combiner(...values);
    prevValues = values;
    return value;
  };

  const subscribe: Subscriber<T> = listener => {
    const unsubscribes = dependencies.map((store, i) =>
      store!.subscribe((nextValue: D1 | D2) => {
        if (nextValue !== prevValues[i]) listener(get());
      })
    );
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  };

  return { get, subscribe, dependencies };
};

export { createStore, createCompositeStore, createSelectorStore, IO };
