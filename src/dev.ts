import { Diff } from './updaters';
import { Assignments, Composite } from './io';
import { HookAssignments } from './hooks';

export type Options = {};

export type UseIOGlobalObject = {
  ios: Assignments<any>;
  getState: () => any;
  getStructuredState: () => any;
  getAllState: () => any;
  devTools?: any;
};

declare global {
  interface Window {
    __USE_IO__: UseIOGlobalObject;
  }
}

export const useDevTools = <T>({
  ios,
  hooks,
  log = false,
  logPrimitivesOnly = true
}: {
  ios?: Assignments<T>;
  hooks?: HookAssignments<T>;
  log: boolean;
  logPrimitivesOnly: boolean;
}) => {
  if (!ios && !hooks) return;
  const ioAssignments = ios || getIosFromHooks(getIOHooks(hooks));
  initGlobalObject(ioAssignments);
  if (log) initLogger(ioAssignments, logPrimitivesOnly);
};

const getIOHooks = <T>(hooks?: HookAssignments<T>): HookAssignments<Diff<T>> => {
  if (!hooks) return {} as HookAssignments<{}>;
  return (Object.keys(hooks) as Array<keyof typeof hooks>)
    .filter(hookName => 'io' in hooks[hookName])
    .reduce((acc, hookName) => {
      const hook = hooks[hookName];
      const stateName = getIOName(hookName);
      return { ...acc, [stateName]: hook };
    }, {} as HookAssignments<Diff<T>>);
};

const getIosFromHooks = <T>(hooks: HookAssignments<T>): Assignments<T> => {
  return (Object.keys(hooks) as Array<keyof typeof hooks>).reduce(
    (acc, key) => ({ ...acc, [key]: hooks[key].io }),
    {} as Assignments<T>
  );
};

const getIOName = <T>(ioName: keyof Assignments<T>) => {
  const withoutUse = (ioName as string).replace(/^use/, '');
  return withoutUse.replace(/^./, withoutUse[0].toLowerCase());
};

const initGlobalObject = <T>(ios: Assignments<T>) => {
  const topLevelIos = getTopLevelIos(ios);
  const primitiveIos = getPrimitiveIos(ios);

  const getState = <T>(ios: Assignments<T>) => {
    return (Object.keys(ios) as Array<keyof typeof ios>).reduce(
      (acc, stateName) => ({ ...acc, [stateName]: ios[stateName].get() }),
      {}
    );
  };

  window.__USE_IO__ = {
    ios: ios,
    getState: () => getState(primitiveIos),
    getStructuredState: () => getState(topLevelIos),
    getAllState: () => getState(ios)
  };
};

const getPrimitiveIos = <T>(ios: Assignments<T>): Assignments<Diff<T>> => {
  return (Object.keys(ios) as Array<keyof typeof ios>)
    .filter(key => !('assignments' in ios[key]) && !('dependencies' in ios[key]))
    .reduce((acc, key) => ({ ...acc, [key]: ios[key] }), {} as Assignments<T>);
};

const getTopLevelIos = <T>(ios: Assignments<T>): Assignments<Diff<T>> => {
  return (Object.keys(ios) as Array<keyof typeof ios>).reduce((acc, stateName, _, ioNames) => {
    const io = ios[stateName];
    if (
      ioNames
        .filter(ioName => 'assignments' in ios[ioName])
        .some(ioName => {
          const composite = (ios[ioName] as any) as Composite<any>;
          return !!(Object.keys(composite.assignments) as Array<keyof typeof composite.assignments>).find(
            (subIoName: string) => composite.assignments[subIoName] === composite
          );
        })
    )
      return acc;
    return { ...acc, [stateName]: io };
  }, {} as Assignments<Diff<T>>);
};

const initLogger = <T>(ios: Assignments<T>, primitivesOnly: boolean = true) =>
  (Object.keys(ios) as Array<keyof typeof ios>).forEach(stateName => {
    const isComplex = 'assignments' in ios[stateName] || 'dependencies' in ios[stateName];
    if (primitivesOnly && isComplex) return;
    ios[stateName].subscribe(state => {
      console.log(stateName, '=', state);
      if (window.__USE_IO__.devTools) {
        window.__USE_IO__.devTools.sendLog(stateName, state);
      }
    });
  });
