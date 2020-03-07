import { IO } from './store';

export const useDevTools = (
  hooks,
  { log = false, logPrimitivesOnly = true } = {
    log: false,
    logPrimitivesOnly: false
  }
) => {
  const stores = getStoresFromHooks(getStoreHooks(hooks));
  initGlobalObject(stores);
  if (log) initLogger(stores, logPrimitivesOnly);
};

const getStoreHooks = hooks => {
  return Object.keys(hooks)
    .filter(hookName => IO in hooks[hookName])
    .reduce((acc, hookName) => {
      const hook = hooks[hookName];
      const stateName = getStoreName(hookName);
      return { ...acc, [stateName]: hook };
    }, {});
};

const getStoresFromHooks = hooks => {
  return Object.keys(hooks).reduce((acc, key) => ({ ...acc, [key]: hooks[key][IO] }), {});
};

const getStoreName = storeName => {
  const withoutUse = storeName.replace(/^use/, '');
  return withoutUse.replace(/^./, withoutUse[0].toLowerCase());
};

const initGlobalObject = stores => {
  const topLevelStores = getTopLevelStores(stores);
  const primitiveStores = getPrimitiveStores(stores);

  const getState = stores => {
    return Object.keys(stores).reduce((acc, stateName) => ({ ...acc, [stateName]: stores[stateName].get() }), {});
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

const getPrimitiveStores = stores => {
  return Object.keys(stores)
    .filter(key => !('assignments' in stores[key]) && !('dependencies' in stores[key]))
    .reduce((acc, key) => ({ ...acc, [key]: stores[key] }), {});
};

const getTopLevelStores = stores => {
  return Object.keys(stores).reduce((acc, stateName, _, storeNames) => {
    const store = stores[stateName];
    if (
      storeNames
        .filter(storeName => 'assignments' in stores[storeName])
        .some(storeName => {
          const composite = stores[storeName];
          return !!Object.keys(composite.assignments).find(
            subStoreName => composite.assignments[subStoreName] === composite
          );
        })
    )
      return acc;
    return { ...acc, [stateName]: store };
  }, {});
};

const initLogger = (stores, primitivesOnly = true) =>
  Object.keys(stores).forEach(stateName => {
    const isComplex = 'assignments' in stores[stateName] || 'dependencies' in stores[stateName];
    if (primitivesOnly && isComplex) return;
    stores[stateName].subscribe(state => {
      console.log(stateName, '=', state);
      if (window[IO].devTools) {
        window[IO].devTools.sendLog(stateName, state);
      }
    });
  });
