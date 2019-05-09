import { TestBed, inject } from '@angular/core/testing';

import { Clone, IReducer, ReduceStore, LogEventType, AllLogEventTypes } from 'reduce-store';
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

class TestState2 extends Clone<TestState2> {
  value: number;
}

@Injectable({ providedIn: 'root' })
class TestState2Reducer implements IReducer<TestState2>{
  stateCtor = TestState2;

  reduceAsync(state: TestState2, newValue: number): Promise<TestState2> {
    console.log('TestState2Reducer newValue', newValue);
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
  private value = 'zzz';
  private state: TestState;
  private state2: TestState2;

  constructor(private store: ReduceStore, value: string) {
    this.store.subscribeToState(TestState, this, this.onStateChanged);
    this.store.subscribeToState(TestState2, this, this.onStateChanged2);
    this.value = value;
    console.log('Component constructor', this.value);
  }

  async updateState(): Promise<void> {
    const state = await this.store.getState(TestState);
    console.log('Component updateState', this.value, state && state.value);
  }

  ngOnDestroy(): void {
    console.log('Component OnDestroy', this.value);
  }

  private onStateChanged(s: TestState): void {
    this.state = s;
    console.log('Component onStateChanged', this.value, this.state && this.state.value);
  }

  private onStateChanged2(s: TestState2): void {
    this.state2 = s;
    console.log('Component onStateChanged2', this.value, this.state2 && this.state2.value);
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

    store.configureLogging(LogEventType.Reducer, { groupType: 'group', shouldLogTime: true }, [TestState]);
    store.configureLogging(AllLogEventTypes, { css: 'color: red;' }, [TestState2]);
    store.turnLogging('on');

    const component1 = new Component(store, 'A');

    await new Promise(r => setTimeout(r, 1000));

    await store.reduce(TestStateReducer, 1);
    await store.reduce(TestState2Reducer, 101);

    await store.suspendState(TestState2);
    console.log('TestState2 suspendState');

    const component2 = new Component(store, 'B');
    store.getState(TestState);
    store.getState(TestState2);
    component1.updateState();

    console.log('state is still suspended');

    setTimeout(() => {
      store.reduce(TestStateReducer, 2);
      store.reduce(TestState2Reducer, 102);
    }, 1000);

    console.log('Right after 2');

    await new Promise(r => setTimeout(r, 1000));

    console.log('end');

    expect(store).toBeTruthy();
  }));
});
