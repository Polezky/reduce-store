import { TestBed, inject } from '@angular/core/testing';

import { ReduceStore } from '../lib/reduce-store.service';
import { Clone, IReducer } from 'reduce-store';
import { Injectable, OnDestroy } from '@angular/core';

class TestState extends Clone<TestState> {
  value: number;
}

@Injectable({ providedIn: 'root' })
class TestStateReducer implements IReducer<TestState>{
  stateCtor = TestState;

  reduceAsync(state: TestState, newValue: number): Promise<TestState> {
    console.log('TestStateReducer newValue', newValue);
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        const newState = state || new TestState({ value: newValue });
        newState.value = newValue;
        resolve(newState);
      }, 1000);
    });
  };
}

class Component implements OnDestroy {
  private value = 'zzz';
  private state: TestState;

  constructor(private store: ReduceStore, value: string) {
    this.store.subscribeToState(TestState, this, this.onStateChanged);
    this.value = value;
  }

  ngOnDestroy(): void {
    console.log('Component OnDestroy', this.value, this);
  }

  private onStateChanged(s: TestState): void {
    this.state = s;
    console.log('Component onStateChanged', this.value, this.state && this.state.value);
  }
}

describe('ReduceStore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReduceStore]
    });
  });

  it('should be created', inject([ReduceStore], async (store: ReduceStore) => {
    console.log('store', store);

    //store.logType = LogType.Reducer;// | LogType.ReducerData;

    //store.lazyReduce(TestStateReducer, 1);

    const component1 = new Component(store, 'A');
    const component2 = new Component(store, 'B');

    await new Promise(r => setTimeout(r, 1000));

    await store.reduce(TestStateReducer, 2);

    component1.ngOnDestroy();

    await store.reduce(TestStateReducer, 3);

    component2.ngOnDestroy();

    setTimeout(() => {
      store.reduce(TestStateReducer, 4);
    }, 1000);

    await new Promise(r => setTimeout(r, 1000));

    console.log('end');

    expect(store).toBeTruthy();
  }));
});
