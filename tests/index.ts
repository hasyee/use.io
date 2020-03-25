import io from '..';

const counter = io.state(10, {
  increase: (value: number) => state => state + value
});
const useCounter = counter.hook();
const [{ increase, set: setCount }, count] = useCounter();

const comp = io.compose(
  { count: counter },
  {
    increase2: (value: number) => state => ({ ...state, count: state.count + value })
  }
);
const useComp = comp.hook();
const [{ set: setComp, increase2 }, compValue] = useComp();
