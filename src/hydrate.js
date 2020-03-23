import React, { useState, useEffect } from 'react';
import { HYDRATOR_ID, IS_SERVER } from './consts';
import { getState, getPrimitiveStores } from './helpers';
import { compose } from './store';

let state;

export const hydrate = stores => {
  state = compose(getPrimitiveStores(stores));

  if (IS_SERVER) return;

  const hiddenInput = window.document.getElementById(HYDRATOR_ID);
  if (!hiddenInput) return;
  const hydratedState = JSON.parse(hiddenInput.value);
  state.set(hydratedState);
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
    value: JSON.stringify(getState(state))
  });
});
