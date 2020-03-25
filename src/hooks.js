import { useRef, useReducer, useCallback, useMemo } from 'react';
import { useIsomorphicLayoutEffect } from './helpers';

const useIO = (store, debugInfo) => {
  const state = useRef(store.get());
  const isSensitive = useRef(false);
  state.current = store.get();
  const [, forceRender] = useReducer(n => n + 1, 0);

  const listener = useCallback(nextState => {
    if (!isSensitive.current || state.current === nextState) return;
    if (debugInfo) console.log('forceRender', debugInfo, nextState);
    forceRender();
  }, []);

  useIsomorphicLayoutEffect(() => {
    return store.subscribe(listener);
  }, []);

  const result = [store, state.current];
  Object.defineProperty(result, 1, {
    get: () => {
      isSensitive.current = true;
      return state.current;
    }
  });
  return result;
};

export const wrap = store => debugInfo => useIO(store, debugInfo);
