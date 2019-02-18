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

  constructor(private store: ReduceStore) {
    this.store.subscribeToState(TestState, this.onStateChanged, this);
  }

  ngOnDestroy(): void {
    console.log('origianl OnDestroy exetuted', this);
  }

  private onStateChanged(s: TestState): void {
    this.state = s;
    console.log('Component, this', this);
  }

}

describe('ReduceStore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReduceStore]
    });
  });

  it('should be created', inject([ReduceStore], async (store: ReduceStore) => {
    const component = new Component(store);

    await store.reduce(TestStateReducer, 1);
    await store.reduce(TestStateReducer, 2);

    component.ngOnDestroy();

    await store.reduce(TestStateReducer, 3);

    expect(store).toBeTruthy();
  }));
});
