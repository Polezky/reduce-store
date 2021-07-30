import { TestBed, inject } from '@angular/core/testing';

import { Clone, IReducer, Store } from 'reduce-store';
import { Injectable, Injector } from '@angular/core';

class TestState extends Clone<TestState> {
  static key: 'TestStateKey';
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

describe('StoreService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TestService]
    });
  });

  it('should be created', inject([Injector], (injector) => {
    Store.config.set({
      cloneMethodName: 'clone',
      resolver: injector
    });

    const store = Store;

    console.log('general.spec', store);

    store.reduce.byConstructorDeferred(TestStateReducer, 1);

    store.state.getObservable(TestState).subscribe(x => {
      console.log('getObservableState 1', x);
    });

    store.reduce.byConstructor(TestStateReducer, 2);

    store.state.get(TestState).then(x => {
      console.log('getState 1', x);
    });

    //store.reduce(TestStateErrorReducer, "-1");

    store.reduce.byConstructor(TestStateReducer, 3);

    store.state.getObservable(TestState).subscribe(x => {
      console.log('getObservableState 2', x);
    });

    store.state.get(TestState)
      .then(x => {
        console.log('getState 2', x);
      })
      .catch(e => {
        console.log('error in getState 2', e);
      });

    expect(store).toBeTruthy();
  }));
});
