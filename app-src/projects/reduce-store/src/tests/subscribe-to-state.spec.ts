import { inject, TestBed } from '@angular/core/testing';

import { Injectable, Injector, OnDestroy } from '@angular/core';
import { Clone } from 'projects/reduce-store/src/lib/classes';
import { IReducer } from 'projects/reduce-store/src/lib/interfaces';
import { Store } from 'projects/reduce-store/src/lib/storage';

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

  constructor(value: string) {
    Store.state.subscribe(TestState, this, this.onStateChanged);
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
      providers: [Injector]
    });
  });

  it('should be created', inject([Injector], async (injector: Injector) => {
    console.log('store', Store);

    Store.config.set({
      resolver: injector,
      cloneMethodName: 'clone',
      disposeMethodName: 'ngOnDestroy'
    });

    const component1 = new Component('A');
    const component2 = new Component('B');

    await new Promise(r => setTimeout(r, 1000));

    await Store.reduce.byConstructor(TestStateReducer, 2);

    component1.ngOnDestroy();

    await Store.reduce.byConstructor(TestStateReducer, 3);

    component2.ngOnDestroy();

    setTimeout(() => {
      Store.reduce.byConstructor(TestStateReducer, 4);
    }, 1000);

    await new Promise(r => setTimeout(r, 1000));

    console.log('end');

    expect(true).toBeTruthy();
  }));
});
