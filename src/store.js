import { isReducer, hasTheSameKeys, bindActions } from './helpers';
import { wrap } from './hooks';

export const state = (initialState, actions) => {
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

  const boundActions = bindActions(actions, set);

  const store = { ...boundActions, get, set, subscribe, primitive: true, hook: () => wrap(store) };
  return store;
};

export const compose = (map, actions) => {
  let state = {};
  let blockListening = false;

  const get = () => {
    if (Object.keys(map).every(key => map[key].get() === state[key])) return state;
    state = Object.keys(map).reduce((acc, key) => ({ ...acc, [key]: map[key].get() }), {});
    return state;
  };

  const set = valueOrReducer => {
    const nextState = isReducer(valueOrReducer) ? valueOrReducer(state) : valueOrReducer;
    if (!hasTheSameKeys(state, nextState)) throw new Error('Composite value is not consequent');
    const lastModifiedIndex = Object.keys(map).reduce(
      (lastIndex, key, index) => (map[key].get() !== nextState[key] ? index : lastIndex),
      -1
    );
    if (lastModifiedIndex === -1) return state;
    blockListening = true;
    Object.keys(map).forEach((key, i) => {
      if (i === lastModifiedIndex) blockListening = false;
      map[key].set(nextState[key]);
    });
    return get();
  };

  const subscribe = listener => {
    const unsubscribes = Object.keys(map).map(key => map[key].subscribe(() => !blockListening && listener(get())));
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  };

  const boundActions = bindActions(actions, set);

  const store = { ...boundActions, get, set, subscribe, primitive: false, hook: () => wrap(store) };
  return store;
};

export const memo = (combiner, deps) => {
  let state;
  let values = Array.from({ length: deps.length });

  const get = () => {
    if (values.every((prevValue, i) => prevValue === deps[i].get())) return state;
    values = deps.map(dep => dep.get());
    state = combiner(...values);
    return state;
  };

  const subscribe = listener => {
    const unsubscribes = deps.map((store, i) =>
      store.subscribe(nextValue => {
        if (nextValue !== values[i]) listener(get());
      })
    );
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  };

  const store = { get, subscribe, primitive: false, hook: () => wrap(store) };
  return store;
};
