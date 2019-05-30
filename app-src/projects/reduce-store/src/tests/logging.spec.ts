import { TestBed, inject } from '@angular/core/testing';

import { Clone, IReducer, ReduceStore, LogEventType, AllLogEventTypes, Store, StoreService } from 'reduce-store';
import { Component as NgComponent, OnDestroy, Injectable } from '@angular/core';

var circularObj: any = {};
circularObj.circularRef = circularObj;
circularObj.list = [circularObj, circularObj];

class TestState extends Clone<TestState> {
  value: number;
  circular = circularObj;

  clone(): TestState {
    console.log('TestState clone');
    return super.clone();
  }
}

export function testStateDelegate(s: TestState = new TestState()): Promise<TestState> {
  return Promise.resolve(new TestState({ value: 1.75 }));
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

  constructor(private store: StoreService, name: string) {
    this.store.state.subscribe(TestState, this, this.onStateChanged);
    this.store.state.subscribe(TestState2, this, this.onStateChanged2);
    this.name = name;
    console.log(`Component ${this.name} constructor`);
  }

  async updateState(): Promise<void> {
    const state = await this.store.state.get(TestState);
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
      providers: [StoreService]
    });
  });

  it('should be created', inject([StoreService], async (store: StoreService) => {
    console.log('store', store);

    store.config.set({ cloneMethodName: 'clone' });
    store.logging.setConfiguration([TestState]);
    store.logging.turnOn();

    store.reduce.byConstructorDeferred(TestStateReducer, 0);
    store.reduce.byDelegateDeferred(TestState, testStateDelegate);
    const componentA = new Component(store, 'A');

    await new Promise(r => setTimeout(r, 1000));

    store.reduce.byConstructor(TestStateReducer, 1);
    store.reduce.byConstructor(TestStateReducer, 1.5);
    store.reduce.byDelegate(TestState, s => Promise.resolve(new TestState({ value: 1.75 })));
    await store.reduce.byConstructor(TestState2Reducer, 101);

    const componentB = new Component(store, 'B');
    store.state.get(TestState);

    await store.state.suspend(TestState);
    console.log('TestState suspendState');

    store.state.get(TestState2);
    componentA.updateState();

    setTimeout(() => {
      store.reduce.byConstructor(TestStateReducer, 2);
      store.reduce.byConstructor(TestState2Reducer, 102);
    }, 1000);

    console.log('Right after 2');

    componentA.ngOnDestroy();

    await store.reduce.byDelegate(TestState, s => Promise.resolve(undefined));

    componentB.ngOnDestroy();

    console.log('end');

    console.log(store.getEntries());

    expect(store).toBeTruthy();
  }));
});
