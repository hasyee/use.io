const isObject = target => typeof target === 'object' && !Array.isArray(target);

export const deepMergeUpdater = diff => state =>
  Object.keys(diff).reduce(
    (acc, key) => ({
      ...acc,
      [key]: isObject(diff[key]) ? deepMergeUpdater(diff[key])(state[key]) : diff[key]
    }),
    state
  );

export const shallowMergeUpdater = diff => state => ({ ...state, ...diff });
