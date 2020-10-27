import { TestBed, inject } from '@angular/core/testing';

import { Clone, IReducer, Store } from 'reduce-store';
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
  store = Store;

  constructor(value: string) {
    this.store.state.subscribe(TestState, this, this.onStateChanged);
    this.value = value;
    console.log('Component constructor', this.value);
  }

  async updateState(): Promise<void> {
    const state = await this.store.state.get(TestState);
    console.log('Component updateState', this.value, state && state.value);
  }

  ngOnDestroy(): void {
    console.log('Component OnDestroy', this.value);
  }

  private onStateChanged(s: TestState): void {
    this.state = s;
    console.log('Component onStateChanged', this.value, this.state && this.state.value);
  }
}

describe('StoreService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: []
    });
  });

  it('should be created', inject([], async () => {
    const store = Store;
    console.log('store', store);

    const component1 = new Component('A');

    await new Promise(r => setTimeout(r, 1000));

    await store.reduce.byConstructor(TestStateReducer, 1);

    await store.state.suspend(TestState);
    console.log('suspendState');

    const component2 = new Component('B');
    component1.updateState();

    console.log('state is still suspended');

    setTimeout(() => {
      store.reduce.byConstructor(TestStateReducer, 2);
    }, 1000);

    console.log('Right after 2');

    await new Promise(r => setTimeout(r, 1000));

    console.log('end');

    expect(store).toBeTruthy();
  }));
});
