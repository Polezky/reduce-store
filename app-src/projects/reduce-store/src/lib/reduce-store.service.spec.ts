import { TestBed, inject } from '@angular/core/testing';

import { ReduceStore } from './reduce-store.service';
import { Clone, IReducer } from 'reduce-store';
import { Injectable } from '@angular/core';

class TestState extends Clone<TestState> {
  value: number;
}

@Injectable({ providedIn: 'root' })
class TestService {
  constructor() { }
  do(param: number): void {
    console.log('TestService do, param =', param);
  }
}

@Injectable({ providedIn: 'root' })
class TestStateReducer implements IReducer<TestState>{
  stateCtor = TestState;

  constructor(private testService: TestService) { }

  reduceAsync(state: TestState, newValue: number): Promise<TestState> {
    console.log('TestStateReducer newValue', newValue);
    this.testService.do(newValue);
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        const newState = state || new TestState({ value: newValue });
        newState.value = newValue;
        resolve(newState);
      }, 1000);
    });
  };
}

@Injectable({ providedIn: 'root' })
class TestStateErrorReducer implements IReducer<TestState>{
  stateCtor = TestState;

  constructor() { }

  reduceAsync(state: TestState, newValue: string): Promise<TestState> {
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        reject('Error of TestStateErrorReducer newValue =' + newValue);
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
    store.lazyReduce(TestStateReducer, 1);

    store.getObservableState(TestState).subscribe(x => {
      console.log('getObservableState 1', x);
    });

    store.reduce(TestStateReducer, 2);

    store.getState(TestState).then(x => {
      console.log('getState 1', x);
    });

    //store.reduce(TestStateErrorReducer, "-1");

    store.reduce(TestStateReducer, 3);

    store.getObservableState(TestState).subscribe(x => {
      console.log('getObservableState 2', x);
    });

    store.getState(TestState)
      .then(x => {
        console.log('getState 2', x);
      })
      .catch(e => {
        console.log('error in getState 2', e);
      });

    expect(store).toBeTruthy();
  }));
});
