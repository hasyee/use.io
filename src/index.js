import * as hooks from './hooks';
import * as updaters from './updaters';
import * as dev from './dev';

export * from './hooks';
export * from './updaters';
export * from './dev';

export default Object.assign(hooks.createStateHook, hooks, updaters, dev, {
  compose: hooks.createCompositeHook,
  select: hooks.createSelectorHook,
  constant: hooks.createConstantHook
});
