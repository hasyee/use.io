import { useState, useEffect } from 'react';
import { io, IO, Selector, Setter, Updater, Assignments, Combiner, Dependencies } from './io';

export type Hook<T> = {
  (): [T, Setter<T>];
  io: IO<T>;
};

export type SelectorHook<T> = {
  (): T;
  io: IO<T>;
};

export type HookAssignments<T> = {
  readonly [P in keyof T]: Hook<T[P]>;
};

export type HookDependencies<D1, D2> = [Hook<D1>, Hook<D2>?];

function use<T, D1, D2>(io: Selector<T, D1, D2>): T;
function use<T>(io: IO<T>): [T, Setter<T>];

function use(io: any): any {
  const update = 'set' in io && 'updater' in io ? <A>(...args: Array<keyof A>) => io.set!(io.update!(...args)) : io.set;
  const [state, setState] = useState(io.get());
  useEffect(() => io.subscribe(setState), [setState]);
  return update ? [state, update] : state;
}

function createHookFromIO<T, D1, D2>(io: Selector<T, D1, D2>): SelectorHook<T>;
function createHookFromIO<T>(io: IO<T>): Hook<T>;

function createHookFromIO(io: any): any {
  const useIO = () => use(io);
  useIO.io = io;
  return useIO;
}

const createIOHook = <T>(initialState: T, update?: Updater<T>) => createHookFromIO(io(initialState, update));

const createCompositeHook = <T>(hookAssignments: HookAssignments<T>, update?: Updater<T>) =>
  createHookFromIO(
    io.compose(
      Object.keys(hookAssignments).reduce(
        (acc, key) => ({ ...acc, [key]: hookAssignments[key].io }),
        {} as Assignments<T>
      ),
      update
    )
  );

const createSelectorHook = <T, D1, D2>(combiner: Combiner<T, D1, D2>, hookDependencies: HookDependencies<D1, D2>) =>
  createHookFromIO(io.select(combiner, hookDependencies.map(hook => hook!.io) as Dependencies<D1, D2>));

createIOHook.compose = createCompositeHook;
createIOHook.select = createSelectorHook;

use.io = createIOHook;

export { use, createHookFromIO as createHook };
