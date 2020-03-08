import React, { useState, useEffect } from 'react';
import { getStoreHooks, getStoresFromHooks, getPrimitiveStores, getState } from './helpers';

const HYDRATOR_ID = '__USE_IO_HYDRATOR__';
let stores;

const isServer = typeof window === 'undefined';

export const hydrate = hooks => {
  stores = getPrimitiveStores(getStoresFromHooks(getStoreHooks(hooks)));

  if (!isServer) {
    const hiddenInput = window.document.getElementById(HYDRATOR_ID);
    if (!hiddenInput) return;
    const hydratedState = JSON.parse(hiddenInput.value);
    Object.keys(hydratedState).forEach(key => stores[key].set(hydratedState[key]));
  }
};

export const Hydrator = React.memo(function Hydrator() {
  const [isRendered, setIsRendered] = useState(true);
  useEffect(() => {
    setIsRendered(false);
  }, []);
  if (!isRendered) return null;
  return React.createElement('input', { id: HYDRATOR_ID, type: 'hidden', value: JSON.stringify(getState(stores)) });
});
