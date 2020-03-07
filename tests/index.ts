import io from '../src/index';

const useCounter = io(10);
const [count, setCount] = useCounter();

const useCounter2 = io(10, (value1: number, value2: number) => state => state + value1 + value2);
const [count2, setCount2] = useCounter2();
setCount2(1, 2);

const useIsOdd = io.select((n, e) => Boolean(n % 2), [useCounter]);
const isOdd = useIsOdd();
