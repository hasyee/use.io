import { STORE } from './consts';

export const getStoreHooks = hooks => {
  return Object.keys(hooks)
    .filter(hookName => STORE in hooks[hookName])
    .reduce((acc, hookName) => {
      const hook = hooks[hookName];
      const stateName = hookName;
      return { ...acc, [stateName]: hook };
    }, {});
};

export const getStoresFromHooks = hooks => {
  return Object.keys(hooks).reduce((acc, key) => ({ ...acc, [key]: hooks[key][STORE] }), {});
};

export const getPrimitiveStores = stores => {
  return Object.keys(stores)
    .filter(key => !('assignments' in stores[key]) && !('dependencies' in stores[key]))
    .reduce((acc, key) => ({ ...acc, [key]: stores[key] }), {});
};

export const getTopLevelStores = stores => {
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

export const getState = stores => {
  return Object.keys(stores).reduce((acc, stateName) => ({ ...acc, [stateName]: stores[stateName].get() }), {});
};
