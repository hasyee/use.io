export type Diff<T> = {
  [K in keyof T]?: T[K];
};

const isObject = (target: any): target is Object => typeof target === 'object' && !Array.isArray(target);

export const deepMergeUpdater = <T>(diff: Diff<T>) => (state: T): T =>
  Object.keys(diff).reduce(
    (acc, key) => ({
      ...acc,
      [key]: isObject(diff[key]) ? deepMergeUpdater(diff[key])(state[key]) : diff[key]
    }),
    state
  );

export const shallowMergeUpdater = <T>(diff: Diff<T>) => (state: T) => ({ ...state, ...diff });
