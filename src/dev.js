import { IO, getStoreHooks, getStoresFromHooks, getPrimitiveStores, getTopLevelStores, getState } from './helpers';

export const useDevTools = (
  hooks,
  { log = false, logPrimitivesOnly = true } = {
    log: false,
    logPrimitivesOnly: false
  }
) => {
  const isServer = typeof window === 'undefined';
  if (isServer) return;
  const stores = getStoresFromHooks(resolveStateNames(getStoreHooks(hooks)));
  initGlobalObject(stores);
  if (log) initLogger(stores, logPrimitivesOnly);
};

const resolveStateNames = registry => {
  return Object.keys(registry).reduce((acc, key) => ({ ...acc, [getStateName(key)]: registry[key] }), {});
};

const getStateName = storeName => {
  const withoutUse = storeName.replace(/^use/, '');
  return withoutUse.replace(/^./, withoutUse[0].toLowerCase());
};

const initGlobalObject = stores => {
  const topLevelStores = getTopLevelStores(stores);
  const primitiveStores = getPrimitiveStores(stores);

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
