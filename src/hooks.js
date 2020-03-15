import { useLayoutEffect, useEffect, useCallback, useMemo, useReducer, useRef } from 'react';
import { STORE } from './consts';
import { createStore, createCompositeStore, createMemoStore } from './store';

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined'
    ? useLayoutEffect
    : useEffect;

const use = (store, updater, isSensitive = true, debugInfo) => {
  const state = useRef(store.get());
  state.current = store.get();
  const [, forceRender] = useReducer(n => n + 1, 0);

  const update = useMemo(() => (!!store.set && !!updater ? (...args) => store.set(updater(...args)) : store.set), [
    store,
    updater
  ]);

  const listener = useCallback(nextState => {
    if (!isSensitive || state.current === nextState) return;
    forceRender();
  }, []);

  useIsomorphicLayoutEffect(() => {
    return store.subscribe(listener);
  }, []);

  if (update) {
    const returnValue = [state.current, update];
    return returnValue;
  } else {
    return state.current;
  }
};

const wrap = (store, updater) => {
  const useStore = (isSensitive, debugInfo) => use(store, updater, isSensitive, debugInfo);
  Object.defineProperty(useStore, STORE, { value: store, configurable: false, enumerable: false, writable: false });
  return useStore;
};

export const state = (initialState, updater) => wrap(createStore(initialState), updater);

export const compose = (hookAssignments, updater) =>
  wrap(
    createCompositeStore(
      Object.keys(hookAssignments).reduce((acc, key) => ({ ...acc, [key]: hookAssignments[key][STORE] }), {})
    ),
    updater
  );

export const memo = (combiner, dependencies) =>
  wrap(
    createMemoStore(
      combiner,
      dependencies.map(hook => hook[STORE])
    )
  );

export const constant = c => () => c;
