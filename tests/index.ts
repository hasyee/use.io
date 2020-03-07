import { io, use } from '../src/index';

/** IO TYPE TESTS **/

const counter = io(10);
const enabled = io(false);
const comp = io.compose({ counter, enabled });
const isOdd = io.select((n, c) => Boolean(n % 2), [counter, comp]);
const o = use(isOdd);
const [c, setC] = use(counter);
const [compV, setComp] = use(comp);

/** HOOK TYPE TESTS **/

const h1 = use.io(10);
const [h1r, setH1R] = h1();

const h2 = use.io.select((n, e) => Boolean(n % 2), [h1]);
const h2r = h2();
