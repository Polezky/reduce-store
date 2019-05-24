import { TestBed, inject } from '@angular/core/testing';

import { Clone, IReducer, ReduceStore, LogEventType, AllLogEventTypes, Store } from 'reduce-store';
import { Injectable, OnDestroy } from '@angular/core';

class TestState extends Clone<TestState> {
  value: number;

  clone(): TestState {
    console.log('TestState clone');
    return super.clone();
  }
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

class TestState2 extends Clone<TestState2> {
  value: number;
}

@Injectable({ providedIn: 'root' })
class TestState2Reducer implements IReducer<TestState2>{
  stateCtor = TestState2;

  reduceAsync(state: TestState2, newValue: number): Promise<TestState2> {
    //console.log('TestState2Reducer newValue', newValue);
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        const newState = state || new TestState2({ value: newValue });
        newState.value = newValue;
        resolve(newState);
      }, 1000);
    });
  };
}

class Component implements OnDestroy {
  private name = 'zzz';
  private state: TestState;
  private state2: TestState2;

  constructor(private store: ReduceStore, name: string) {
    this.store.subscribeToState(TestState, this, this.onStateChanged);
    this.store.subscribeToState(TestState2, this, this.onStateChanged2);
    this.name = name;
    console.log(`Component ${this.name} constructor`);
  }

  async updateState(): Promise<void> {
    const state = await this.store.getState(TestState);
    console.log(`Component ${this.name} updateState`, state && state.value);
  }

  ngOnDestroy(): void {
    console.log(`Component ${this.name} OnDestroy`);
  }

  private onStateChanged(s: TestState): void {
    this.state = s;
    console.log(`Component ${this.name} onStateChanged`, this.state && this.state.value);
  }

  private onStateChanged2(s: TestState2): void {
    this.state2 = s;
    console.log(`Component ${this.name} onStateChanged2`, this.state2 && this.state2.value);
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

    Store.logging.setConfiguration([TestState]);
    Store.logging.turnOn();

    Store.config.set({ cloneMethodName: 'clone1' });
    console.log('Store.config', JSON.parse(JSON.stringify(Store.config)))

    Store.state.get(TestState);

    Store.config.set({ cloneMethodName: 'clone' });
    console.log('Store.config', JSON.parse(JSON.stringify(Store.config)))

    store.lazyReduce(TestStateReducer, 0);
    store.lazyReduceByDelegate(TestState, s => Promise.resolve(new TestState({ value: 0.25 })));
    const componentA = new Component(store, 'A');

    await new Promise(r => setTimeout(r, 1000));

    store.reduce(TestStateReducer, 1);
    store.reduce(TestStateReducer, 1.5);
    store.reduceByDelegate(TestState, s => Promise.resolve(new TestState({ value: 1.75})));
    await store.reduce(TestState2Reducer, 101);

    const componentB = new Component(store, 'B');
    store.getState(TestState);

    await store.suspendState(TestState);
    console.log('TestState suspendState');

    store.getState(TestState2);
    componentA.updateState();

    setTimeout(() => {
      store.reduce(TestStateReducer, 2);
      store.reduce(TestState2Reducer, 102);
    }, 1000);

    console.log('Right after 2');

    componentA.ngOnDestroy();

    await store.reduceByDelegate(TestState, s => Promise.resolve(undefined));

    componentB.ngOnDestroy();

    console.log('end');

    console.log(store.getEntries());

    expect(store).toBeTruthy();
  }));
});
