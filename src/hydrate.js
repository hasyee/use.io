import React, { useState, useEffect } from 'react';
import { getStoreHooks, getStoresFromHooks, getPrimitiveStores, getState } from './helpers';

const HYDRATOR_ID = '__USE_IO_HYDRATOR__';

export const hydrate = hooks => {
  const stores = getPrimitiveStores(getStoresFromHooks(getStoreHooks(hooks)));
  const isServer = typeof window === 'undefined';
  if (isServer) {
    return () =>
      React.createElement('input', { id: HYDRATOR_ID, type: 'hidden', value: JSON.stringify(getState(stores)) });
  } else {
    const hiddenInput = window.document.getElementById(HYDRATOR_ID);
    if (!hiddenInput) return;
    const hydratedState = JSON.parse(hiddenInput.value);
    Object.keys(hydratedState).forEach(key => stores[key].set(hydratedState[key]));
    return () => {
      const [isRendered, setIsRendered] = useState(true);
      useEffect(() => {
        setIsRendered(false);
      }, []);
      return (
        isRendered &&
        React.createElement('input', { id: HYDRATOR_ID, type: 'hidden', value: JSON.stringify(getState(stores)) })
      );
    };
  }
};
