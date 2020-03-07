import { useState, useEffect, useMemo } from 'react';
import {
  createStore,
  createCompositeStore,
  createSelectorStore,
  Store,
  Selector,
  Setter,
  Assignments,
  Combiner,
  Dependencies,
  ValueOrReducer,
  IO
} from './store';

export type Updater<T> = (...args: any[]) => ValueOrReducer<T>;

export type Hook<T, U = Setter<T>> = () => [T, U];

export type SelectorHook<T> = () => T;

export type HookAssignments<T> = {
  readonly [P in keyof T]: Hook<T[P]>;
};

export type HookDependencies<D1, D2> = [Hook<D1>, Hook<D2>?];

type IUse = {
  <T, D1, D2>(store: Selector<T, D1, D2>): T;
  <T>(store: Store<T>, updater?: Updater<T>): [T, typeof updater];
};

const use: IUse = (store: any, updater?: any): any => {
  const update = useMemo(
    () => (!!store.set && !!updater ? <A>(...args: A[]) => store.set!(updater(...args)) : store.set),
    [store, updater]
  );
  const [state, setState] = useState(store.get());
  useEffect(() => store.subscribe(setState), [setState]);
  return update ? [state, update] : state;
};

const useNot: IUse = (store: any, updater?: any): any => {
  const update = !!store.set && !!updater ? <A>(...args: A[]) => store.set!(updater!(...args)) : store.set;
  return update ? [store.get(), update] : store.get();
};

const wrap: {
  <T, D1, D2>(store: Selector<T, D1, D2>): SelectorHook<T>;
  <T>(store: Store<T>, updater?: Updater<T>): Hook<T, typeof updater>;
} = (store: any, updater?: any): any => {
  const useStore = (useHook: boolean = true) => (useHook ? use(store, updater) : useNot(store, updater));
  Object.defineProperty(useStore, IO, { value: store, configurable: false, enumerable: false, writable: false });
  return useStore;
};

const createStateHook = <T>(initialState: T, updater?: Updater<T>) => wrap(createStore(initialState), updater);

const createCompositeHook = <T>(hookAssignments: HookAssignments<T>, updater?: Updater<T>) =>
  wrap(
    createCompositeStore(
      Object.keys(hookAssignments).reduce(
        (acc, key) => ({ ...acc, [key]: hookAssignments[key][IO] }),
        {} as Assignments<T>
      )
    ),
    updater
  );

const createSelectorHook = <T, D1, D2>(combiner: Combiner<T, D1, D2>, hookDependencies: HookDependencies<D1, D2>) =>
  wrap(createSelectorStore(combiner, hookDependencies.map(hook => hook![IO]) as Dependencies<D1, D2>));

const createConstantHook = <T>(constant: T) => () => constant;

createStateHook.compose = createCompositeHook;
createStateHook.select = createSelectorHook;
createStateHook.constant = createConstantHook;

export { createStateHook, createCompositeHook, createSelectorHook, createConstantHook };
