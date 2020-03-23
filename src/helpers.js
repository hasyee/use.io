import { useEffect, useLayoutEffect } from 'react';

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined'
    ? useLayoutEffect
    : useEffect;

export const isReducer = valueOrReducer => typeof valueOrReducer === 'function';

export const hasTheSameKeys = (a, b) => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return aKeys.every(key => bKeys.includes(key)) && bKeys.every(key => aKeys.includes(key));
};

export const bindActions = (actions, set) => {
  if (!actions) return {};
  return Object.keys(actions).reduce((acc, key) => ({ ...acc, [key]: (...args) => set(actions[key](...args)) }), {});
};

export const getPrimitiveStores = stores => {
  return Object.keys(stores)
    .filter(key => !('assignments' in stores[key]) && !('dependencies' in stores[key]))
    .reduce((acc, key) => ({ ...acc, [key]: stores[key] }), {});
};

export const getState = stores => {
  return Object.keys(stores).reduce((acc, stateName) => ({ ...acc, [stateName]: stores[stateName].get() }), {});
};
