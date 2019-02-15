import { TestBed, inject } from '@angular/core/testing';

import { ReduceStore } from '../lib/reduce-store.service';
import { Clone, IReducer } from 'reduce-store';
import { Injectable } from '@angular/core';

class TestState extends Clone<TestState> {
  value: number;
}

@Injectable({ providedIn: 'root' })
class TestStateReducer implements IReducer<TestState>{
  stateCtor = TestState;

  reduceAsync(state: TestState, newValue: number): Promise<TestState> {
    console.log('RemoveStateTest TestStateReducer newValue', newValue);
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        const newState = state || new TestState({ value: newValue });
        newState.value = newValue;
        resolve(newState);
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

  it('should be created', inject([ReduceStore], async (store: ReduceStore) => {
    store.lazyReduce(TestStateReducer, 1);

    store.getObservableState(TestState).subscribe(x => {
      console.log('RemoveStateTest getObservableState 1', x);
    });

    await store.reduce(TestStateReducer, 2);

    await store.getState(TestState).then(x => {
      console.log('RemoveStateTest getState 1', x);
    });

    await store.removeState(TestState);

    store.getState(TestState).then(x => {
      console.log('RemoveStateTest getState 2', x);
    });

    expect(store).toBeTruthy();
  }));
});
