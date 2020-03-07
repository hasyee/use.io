import { HookMap, Diff, ComposedHook } from './types';

export const useDevTools = <T>(
  hooks: HookMap<T>,
  { log = false, logPrimitivesOnly = true } = { log: false, logPrimitivesOnly: true }
) => {
  const stateHooks = getStateHooks(hooks);
  initGlobalObject(stateHooks);
  if (log) initLogger(stateHooks, logPrimitivesOnly);
};

const getStateHooks = <T>(hooks: HookMap<T>): HookMap<Diff<T>> =>
  (Object.keys(hooks) as Array<keyof typeof hooks>)
    .filter(hookName => !!hooks[hookName].get)
    .reduce((acc, hookName) => {
      const hook = hooks[hookName];
      const stateName = getStateName(hookName);
      return { ...acc, [stateName]: hook };
    }, {} as HookMap<Diff<T>>);

const getStateName = <T>(hookName: keyof HookMap<T>) => {
  const withoutUse = (hookName as string).replace(/^use/, '');
  return withoutUse.replace(/^./, withoutUse[0].toLowerCase());
};

const initGlobalObject = <T>(stateHooks: HookMap<T>) => {
  const topLevelHooks = getTopLevelHooks(stateHooks);
  const pureStateHooks = getPureHooks(stateHooks);

  const getState = <T>(hooks: HookMap<T>) => {
    return (Object.keys(hooks) as Array<keyof typeof hooks>).reduce(
      (acc, stateName) => ({ ...acc, [stateName]: hooks[stateName].get() }),
      {}
    );
  };

  window.__USE_IO__ = {
    hooks: stateHooks,
    getState: () => getState(pureStateHooks),
    getStructuredState: () => getState(topLevelHooks),
    getAllState: () => getState(stateHooks)
  };
};

const getPureHooks = <T>(stateHooks: HookMap<T>): HookMap<Diff<T>> => {
  return (Object.keys(stateHooks) as Array<keyof typeof stateHooks>)
    .filter(key => !('hookMap' in stateHooks[key]) && !('hookDeps' in stateHooks[key]))
    .reduce((acc, key) => ({ ...acc, [key]: stateHooks[key] }), {} as HookMap<T>);
};

const getTopLevelHooks = <T>(stateHooks: HookMap<T>): HookMap<Diff<T>> => {
  return (Object.keys(stateHooks) as Array<keyof typeof stateHooks>).reduce((acc, stateName, _, hookNames) => {
    const hook = stateHooks[stateName];
    if (
      hookNames
        .filter(hookName => 'hookMap' in stateHooks[hookName])
        .some(hookName => {
          const hook = stateHooks[hookName] as ComposedHook<Object>;
          return !!(Object.keys(hook.hookMap) as Array<keyof typeof hook.hookMap>).find(
            subHookName => hook.hookMap[subHookName] === hook
          );
        })
    )
      return acc;
    return { ...acc, [stateName]: hook };
  }, {} as HookMap<Diff<T>>);
};

const initLogger = <T>(stateHooks: HookMap<T>, primitivesOnly: boolean = true) =>
  (Object.keys(stateHooks) as Array<keyof typeof stateHooks>).forEach(stateName => {
    const isComplex = 'hookMap' in stateHooks[stateName] || 'hookDeps' in stateHooks[stateName];
    if (primitivesOnly && isComplex) return;
    stateHooks[stateName].subscribe(state => {
      console.log(stateName, '=', state);
      if (window.__USE_IO__.devTools) {
        window.__USE_IO__.devTools.sendLog(stateName, state);
      }
    });
  });
