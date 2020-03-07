import { useState, useEffect, useMemo } from 'react';
import {
  createStore,
  createCompositeStore,
  createSelectorStore,
  Store,
  Selector,
  Setter,
  Updater,
  Assignments,
  Combiner,
  Dependencies,
  IO
} from './store';

export type Hook<T> = () => [T, Setter<T>];

export type SelectorHook<T> = () => T;

export type HookAssignments<T> = {
  readonly [P in keyof T]: Hook<T[P]>;
};

export type HookDependencies<D1, D2> = [Hook<D1>, Hook<D2>?];

type IUse = {
  <T, D1, D2>(store: Selector<T, D1, D2>): T;
  <T>(store: Store<T>): [T, Setter<T>];
};

const use: IUse = (store: any): any => {
  const update = useMemo(
    () => ('set' in store && 'update' in store ? <A>(...args: A[]) => store.set!(store.update!(...args)) : store.set),
    [store]
  );
  const [state, setState] = useState(store.get());
  useEffect(() => store.subscribe(setState), [setState]);
  return update ? [state, update] : state;
};

const useNot: IUse = (store: any): any => {
  const update =
    'set' in store && 'update' in store ? <A>(...args: A[]) => store.set!(store.update!(...args)) : store.set;
  return update ? [store.get(), update] : store.get();
};

const wrap: {
  <T, D1, D2>(store: Selector<T, D1, D2>): SelectorHook<T>;
  <T>(store: Store<T>): Hook<T>;
} = (store: any): any => {
  const useStore = (useHook: boolean = true) => (useHook ? use(store) : useNot(store));
  Object.defineProperty(useStore, IO, { value: store, configurable: false, enumerable: false, writable: false });
  return useStore;
};

const createStateHook = <T>(initialState: T, update?: Updater<T>) => wrap(createStore(initialState, update));

const createCompositeHook = <T>(hookAssignments: HookAssignments<T>, update?: Updater<T>) =>
  wrap(
    createCompositeStore(
      Object.keys(hookAssignments).reduce(
        (acc, key) => ({ ...acc, [key]: hookAssignments[key][IO] }),
        {} as Assignments<T>
      ),
      update
    )
  );

const createSelectorHook = <T, D1, D2>(combiner: Combiner<T, D1, D2>, hookDependencies: HookDependencies<D1, D2>) =>
  wrap(createSelectorStore(combiner, hookDependencies.map(hook => hook![IO]) as Dependencies<D1, D2>));

const createConstantHook = <T>(constant: T) => () => constant;

createStateHook.compose = createCompositeHook;
createStateHook.select = createSelectorHook;
createStateHook.constant = createConstantHook;

export { createStateHook, createCompositeHook, createSelectorHook, createConstantHook };
