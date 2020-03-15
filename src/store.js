const isReducer = valueOrReducer => typeof valueOrReducer === 'function';

const hasTheSameKeys = (a, b) => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return aKeys.every(key => bKeys.includes(key)) && bKeys.every(key => aKeys.includes(key));
};

export const createStore = initialState => {
  let state = initialState;
  const listeners = new Set();

  const get = () => state;

  const set = valueOrReducer => {
    const nextState = isReducer(valueOrReducer) ? valueOrReducer(state) : valueOrReducer;
    if (state !== nextState) {
      state = nextState;
      listeners.forEach(listener => listener(state));
    }
    return state;
  };

  const subscribe = listener => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { get, set, subscribe };
};

export const createCompositeStore = assignments => {
  let state = Object.keys(assignments).reduce((acc, key) => ({ ...acc, [key]: assignments[key].get() }), {});
  let blockListening = false;

  const get = () => state;

  const set = valueOrReducer => {
    const nextState = isReducer(valueOrReducer) ? valueOrReducer(state) : valueOrReducer;
    if (!hasTheSameKeys(state, nextState)) throw new Error('Composite value is not consequent');
    const lastModifiedIndex = Object.keys(assignments).reduce(
      (lastIndex, key, index) => (assignments[key].get() !== nextState[key] ? index : lastIndex),
      -1
    );
    if (lastModifiedIndex === -1) return state;
    state = nextState;
    blockListening = true;
    Object.keys(assignments).forEach((key, i) => {
      if (i === lastModifiedIndex) blockListening = false;
      assignments[key].set(nextState[key]);
    });
    return nextState;
  };

  const subscribe = listener => {
    const unsubscribes = Object.keys(assignments).map(key =>
      assignments[key].subscribe(() => !blockListening && listener(get()))
    );
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  };

  return { get, set, subscribe, assignments };
};

export const createMemoStore = (combiner, dependencies) => {
  let state;
  let prevValues;

  const get = () => {
    const values = dependencies.map(store => store.get());
    if (Array.isArray(prevValues) && values.every((value, i) => value === prevValues[i])) return state;
    const value = combiner(...values);
    prevValues = values;
    state = value;
    return state;
  };

  const subscribe = listener => {
    const unsubscribes = dependencies.map((store, i) =>
      store.subscribe(nextValue => {
        if (nextValue !== prevValues[i]) listener(get());
      })
    );
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  };

  return { get, subscribe, dependencies };
};
