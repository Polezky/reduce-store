import { TestBed, inject } from '@angular/core/testing';

import { ReduceStore } from './reduce-store.service';
import { Clone, IReducer } from 'reduce-store';

class TestState extends Clone<TestState> {
  value: number;
}

class TestStateReducer implements IReducer<TestState>{
  stateCtor = TestState;

  constructor(private newValue: number) { }

  reduceAsync(state: TestState, stateGetter): Promise<TestState> {
    console.log('TestStateReducer newValue', this.newValue);
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        const newState = state || new TestState({ value: this.newValue });
        newState.value = this.newValue;
        resolve(newState);
      }, 1000);
    });
  };
}

class TestStateErrorReducer implements IReducer<TestState>{
  stateCtor = TestState;

  constructor(private newValue: number) { }

  reduceAsync(state: TestState, stateGetter): Promise<TestState> {
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        reject('Error of TestStateErrorReducer');
      }, 1000);
    });
  };
}

describe('ReduceStore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReduceStore]
    });
  });

  it('should be created', inject([ReduceStore], (store: ReduceStore) => {
    const r1 = new TestStateReducer(1);
    const r2 = new TestStateReducer(2);
    const re = new TestStateErrorReducer(-1);
    const r3 = new TestStateReducer(3);

    store.lazyReduce(r1);

    store.getObservableState(TestState).subscribe(x => {
      console.log('getObservableState 1', x.value);
    });

    store.reduce(r2);

    store.getState(TestState).then(x => {
      console.log('getState 1', x.value);
    });

    store.reduce(re);

    store.reduce(r3);

    store.getObservableState(TestState).subscribe(x => {
      console.log('getObservableState 2', x.value);
    });

    store.getState(TestState)
      .then(x => {
        console.log('getState 2', x.value);
      })
      .catch(e => {
        console.log('error in getState 2', e);
      });

    expect(store).toBeTruthy();
  }));
});
