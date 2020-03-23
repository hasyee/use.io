import { IS_SERVER } from './consts';
import { getPrimitiveStores, getState } from './helpers';

export const useDevTools = (
  stores,
  { log = false, logPrimitivesOnly = true } = {
    log: false,
    logPrimitivesOnly: false
  }
) => {
  initGlobalObject(stores);
  if (log) initLogger(stores, logPrimitivesOnly);
};

const initGlobalObject = stores => {
  const primitiveStores = getPrimitiveStores(stores);

  const globalObject = {
    stores,
    getState: (all = true) => getState(all ? stores : primitiveStores)
  };

  if (IS_SERVER) {
    if (!('io' in global))
      Object.defineProperties(global, {
        io: { value: globalObject, configurable: false, enumerable: false, writable: false }
      });
  } else {
    if (!('io' in window))
      Object.defineProperties(window, {
        io: { value: globalObject, configurable: false, enumerable: false, writable: false }
      });
  }
};

const initLogger = (stores, primitivesOnly = true) =>
  Object.keys(stores).forEach(stateName => {
    const isComplex = 'assignments' in stores[stateName] || 'dependencies' in stores[stateName];
    if (primitivesOnly && isComplex) return;
    stores[stateName].subscribe(state => {
      console.log(stateName, '=', state);
      /* if (window.io.devTools) {
        window.io.devTools.sendLog(stateName, state);
      } */
    });
  });
