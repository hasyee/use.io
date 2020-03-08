import * as hooks from './hooks';
import * as updaters from './updaters';
import * as dev from './dev';
import * as hydrate from './hydrate';

export * from './hooks';
export * from './updaters';
export * from './dev';
export * from './hydrate';

export default Object.assign(hooks.io, hooks, updaters, dev, hydrate);
