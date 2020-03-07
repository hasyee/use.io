import { useState, useEffect, useMemo } from 'react';
import { createStore, createCompositeStore, createSelectorStore, IO } from './store';

const use = (store, updater) => {
  const update = useMemo(() => (!!store.set && !!updater ? (...args) => store.set(updater(...args)) : store.set), [
    store,
    updater
  ]);
  const [state, setState] = useState(store.get());
  useEffect(() => store.subscribe(setState), [setState]);
  return update ? [state, update] : state;
};

const useNot = (store, updater) => {
  const update = !!store.set && !!updater ? (...args) => store.set(updater(...args)) : store.set;
  return update ? [store.get(), update] : store.get();
};

const wrap = (store, updater) => {
  const useStore = (useHook = true) => (useHook ? use(store, updater) : useNot(store, updater));
  Object.defineProperty(useStore, IO, { value: store, configurable: false, enumerable: false, writable: false });
  return useStore;
};

const createStateHook = (initialState, updater) => wrap(createStore(initialState), updater);

const createCompositeHook = (hookAssignments, updater) =>
  wrap(
    createCompositeStore(
      Object.keys(hookAssignments).reduce((acc, key) => ({ ...acc, [key]: hookAssignments[key][IO] }), {})
    ),
    updater
  );

const createSelectorHook = (combiner, hookDependencies) =>
  wrap(
    createSelectorStore(
      combiner,
      hookDependencies.map(hook => hook[IO])
    )
  );

const createConstantHook = constant => () => constant;

export { createStateHook, createCompositeHook, createSelectorHook, createConstantHook };
