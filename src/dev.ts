import { Diff } from './updaters';
import { Assignments, Composite, IO } from './store';
import { HookAssignments } from './hooks';

export type Options = {};

export type GlobalObject = {
  hooks: Assignments<any>;
  getState: () => any;
  getStructuredState: () => any;
  getAllState: () => any;
  devTools?: any;
};

export const useDevTools = <T>(
  hooks: HookAssignments<T>,
  {
    log = false,
    logPrimitivesOnly = true
  }: {
    log: boolean;
    logPrimitivesOnly: boolean;
  }
) => {
  const stores = getStoresFromHooks(getStoreHooks(hooks));
  initGlobalObject(stores);
  if (log) initLogger(stores, logPrimitivesOnly);
};

const getStoreHooks = <T>(hooks: HookAssignments<T>): HookAssignments<Diff<T>> => {
  return (Object.keys(hooks) as Array<keyof typeof hooks>)
    .filter(hookName => IO in hooks[hookName])
    .reduce((acc, hookName) => {
      const hook = hooks[hookName];
      const stateName = getStoreName(hookName);
      return { ...acc, [stateName]: hook };
    }, {} as HookAssignments<Diff<T>>);
};

const getStoresFromHooks = <T>(hooks: HookAssignments<T>): Assignments<T> => {
  return (Object.keys(hooks) as Array<keyof typeof hooks>).reduce(
    (acc, key) => ({ ...acc, [key]: hooks[key][IO] }),
    {} as Assignments<T>
  );
};

const getStoreName = <T>(storeName: keyof Assignments<T>) => {
  const withoutUse = (storeName as string).replace(/^use/, '');
  return withoutUse.replace(/^./, withoutUse[0].toLowerCase());
};

const initGlobalObject = <T>(stores: Assignments<T>) => {
  const topLevelStores = getTopLevelStores(stores);
  const primitiveStores = getPrimitiveStores(stores);

  const getState = <T>(stores: Assignments<T>) => {
    return (Object.keys(stores) as Array<keyof typeof stores>).reduce(
      (acc, stateName) => ({ ...acc, [stateName]: stores[stateName].get() }),
      {}
    );
  };

  const globalObject = {
    stores,
    getState: () => getState(primitiveStores),
    getStructuredState: () => getState(topLevelStores),
    getAllState: () => getState(stores)
  };

  Object.defineProperties(window, {
    [IO]: { value: globalObject, configurable: false, enumerable: false, writable: false },
    io: { value: globalObject, configurable: false, enumerable: false, writable: false }
  });
};

const getPrimitiveStores = <T>(stores: Assignments<T>): Assignments<Diff<T>> => {
  return (Object.keys(stores) as Array<keyof typeof stores>)
    .filter(key => !('assignments' in stores[key]) && !('dependencies' in stores[key]))
    .reduce((acc, key) => ({ ...acc, [key]: stores[key] }), {} as Assignments<T>);
};

const getTopLevelStores = <T>(stores: Assignments<T>): Assignments<Diff<T>> => {
  return (Object.keys(stores) as Array<keyof typeof stores>).reduce((acc, stateName, _, storeNames) => {
    const store = stores[stateName];
    if (
      storeNames
        .filter(storeName => 'assignments' in stores[storeName])
        .some(storeName => {
          const composite = (stores[storeName] as any) as Composite<any>;
          return !!(Object.keys(composite.assignments) as Array<keyof typeof composite.assignments>).find(
            (subStoreName: string) => composite.assignments[subStoreName] === composite
          );
        })
    )
      return acc;
    return { ...acc, [stateName]: store };
  }, {} as Assignments<Diff<T>>);
};

const initLogger = <T>(stores: Assignments<T>, primitivesOnly: boolean = true) =>
  (Object.keys(stores) as Array<keyof typeof stores>).forEach(stateName => {
    const isComplex = 'assignments' in stores[stateName] || 'dependencies' in stores[stateName];
    if (primitivesOnly && isComplex) return;
    stores[stateName].subscribe(state => {
      console.log(stateName, '=', state);
      if (window[IO].devTools) {
        window[IO].devTools.sendLog(stateName, state);
      }
    });
  });
