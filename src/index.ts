import { useState, useEffect } from 'react';
import {
  ValueOrReducer,
  Listener,
  Store,
  Updater,
  Subscriber,
  Getter,
  Setter,
  Reducer,
  Hook,
  HookMap,
  ComposedHook,
  SelectorHook
} from './types';
export * from './updaters';
export * from './dev';

const isReducer = <T>(valueOrReducer: ValueOrReducer<T>): valueOrReducer is Reducer<T> =>
  typeof valueOrReducer === 'function';

const createStore = <T>(initialState: T): Store<T> => {
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

  return { get, set, subscribe };
};

const createHookByStore = <T>({ get, set, subscribe, updater }: Store<T>): Hook<T> => {
  const update = set && updater ? (...args: any[]) => set(updater(...args)) : set;

  const useSharedState = () => {
    const [value, setter] = useState(get());
    useEffect(() => subscribe(setter), [setter]);
    return update ? [value, update] : value;
  };

  if (set) useSharedState.origSet = set;
  if (update) useSharedState.set = update;
  useSharedState.get = get;
  useSharedState.subscribe = subscribe;

  return useSharedState;
};

export const createStateHook = <T>(initialState: T, updater: Updater<T>) => {
  const store = createStore(initialState);
  return createHookByStore({ ...store, updater });
};

export const combineStateHooks = <T>(hookMap: HookMap<T>, updater: Updater<T>) => {
  let blockListening = false;

  const get: Getter<T> = () =>
    Object.keys(hookMap).reduce((acc, key) => ({ ...acc, [key]: hookMap[key].get() }), {} as T);

  const set: Setter<T> = valueOrReducer => {
    const nextState = isReducer(valueOrReducer) ? valueOrReducer(get()) : valueOrReducer;
    const lastModifiedHookIndex = Object.keys(hookMap).reduce(
      (lastIndex, key, index) => (hookMap[key].get() !== nextState[key] ? index : lastIndex),
      -1
    );
    if (lastModifiedHookIndex === -1) return nextState;
    blockListening = true;
    Object.keys(hookMap).forEach((key, i) => {
      if (i === lastModifiedHookIndex) blockListening = false;
      hookMap[key].origSet(nextState[key]);
    });
    return nextState;
  };

  const subscribe: Subscriber<T> = listener => {
    const unsubscribes = Object.keys(hookMap).map(key =>
      hookMap[key].subscribe(() => !blockListening && listener(get()))
    );
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  };

  const useCombinedState = createHookByStore({ get, set, subscribe, updater }) as ComposedHook<T>;

  useCombinedState.hookMap = hookMap;

  return useCombinedState;
};

export const createSelectorHook = <T, S>(combiner: (...args: S[]) => T, hookDeps: Hook<S>[]): SelectorHook<T> => {
  let prevValues: S[];

  const get: Getter<T> = () => {
    const values = hookDeps.map(hook => hook.get());
    const value = combiner(...values);
    prevValues = values;
    return value;
  };

  const subscribe: Subscriber<T> = listener => {
    const unsubscribes = hookDeps.map((hook, i) =>
      hook.subscribe(nextValue => {
        if (nextValue !== prevValues[i]) listener(get());
      })
    );
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  };

  const useSelector = createHookByStore({ get, subscribe }) as SelectorHook<T>;

  useSelector.hookDeps = hookDeps;

  return useSelector;
};

export const createResourceHook = <T>(resource: T) => () => resource;
