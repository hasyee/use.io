import React, { useState, useEffect } from 'react';
import { HYDRATOR_ID, IS_SERVER } from './consts';
import { getState } from './helpers';

let stores;

export const hydrate = s => {
  stores = s;
  
  if (IS_SERVER) return;

  const hiddenInput = window.document.getElementById(HYDRATOR_ID);
  if (!hiddenInput) return;
  const hydratedState = JSON.parse(hiddenInput.value);
  Object.keys(hydratedState).forEach(key => stores[key].set(hydratedState[key]));
};

export const Hydrator = React.memo(function Hydrator() {
  const [isRendered, setIsRendered] = useState(true);
  useEffect(() => {
    setIsRendered(false);
  }, []);
  if (!isRendered) return null;
  return React.createElement('input', {
    id: HYDRATOR_ID,
    type: 'hidden',
    value: JSON.stringify(getState(stores))
  });
});
