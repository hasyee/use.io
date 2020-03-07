import io from '../src/index';

const useCounter = io(10);
const [count, setCount] = useCounter();
setCount(count + 1);
useCounter(false);

const useCounter2 = io(10, (value1: number, value2: number) => state => state + value1 + value2);
const [count2, setCount2] = useCounter2();
setCount2(count2 + 1, 2);
useCounter2(false);

const useComp = io.compose({ count1: useCounter, count2: useCounter2 });
const [comp, setComp] = useComp();
setComp({ count1: comp.count1 + 1, count2: comp.count2 + 1 });
useComp(false);

const useComp2 = io.compose({ count1: useCounter, count2: useCounter2 }, (count1: number, count2: number) => state => ({
  ...state,
  count1,
  count2
}));
const [comp2, setComp2] = useComp2();
setComp2(comp2.count1 + 1, comp2.count2 + 1);
useComp2(false);

const useIsOdd = io.select((n, e) => Boolean(n % 2), [useCounter]);
const isOdd = useIsOdd();
isOdd === true;
useIsOdd(false);

const useIsEven = io.select(isOdd => !isOdd, [useIsOdd]);
const isEven = useIsEven();
isEven === true;
useIsEven(false);
