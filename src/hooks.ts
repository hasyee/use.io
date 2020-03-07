import { useState, useEffect } from 'react';
import { io, IO, Setter, Updater, Assignments, Combiner } from './io';

export type Hook<T> = {
  (): T | [T, Setter<T>];
  io: IO<T>;
};

export type HookAssignments<T> = {
  readonly [P in keyof T]: Hook<T[P]>;
};

const use = <T>(io: IO<T>): T | [T, Setter<T>] => {
  const update = 'set' in io && 'updater' in io ? <A>(...args: Array<keyof A>) => io.set!(io.update!(...args)) : io.set;
  const [state, setState] = useState(io.get());
  useEffect(() => io.subscribe(setState), [setState]);
  return update ? [state, update] : state;
};

const createHook = <T>(io: IO<T>): Hook<T> => {
  const useIO = (use(io) as any) as Hook<T>;
  useIO.io = io;
  return useIO;
};

const createIOHook = <T>(initialState: T, update?: Updater<T>) => createHook(io(initialState, update));

const createCompositeHook = <T>(hookAssignments: HookAssignments<T>, update?: Updater<T>) =>
  createHook(
    io.compose(
      Object.keys(hookAssignments).reduce(
        (acc, key) => ({ ...acc, [key]: hookAssignments[key].io }),
        {} as Assignments<T>
      ),
      update
    )
  );

const createSelectorHook = <T, D>(combiner: Combiner<T, D>, hookDependencies: Hook<keyof D>[]) =>
  createHook(
    io.select(
      combiner,
      hookDependencies.map(hook => hook.io)
    )
  );

createIOHook.compose = createCompositeHook;
createIOHook.select = createSelectorHook;

use.io = createIOHook;

export { use, createHook };
