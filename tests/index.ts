import io from '../src/index';

const h1 = io(10);
const [h1r, setH1R] = h1();

const h2 = io.select((n, e) => Boolean(n % 2), [h1]);
const h2r = h2();
