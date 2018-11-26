import { TestBed, inject } from '@angular/core/testing';

import { ReduceStore } from '../lib/reduce-store.service';
import { IReducer } from '../lib/interfaces';
import { CollectionState, Clone } from '../lib/classes';
import { Injectable } from '@angular/core';

class Base {
  baseProp1: string;
  baseProp2: number;
}

class Derived extends Base {
  derivedProp1: number;
  derivedProp2: string;

  constructor(init: Partial<Derived>) {
    super();
    Object.assign(this, init);
  }

  clone(): Derived {
    return new Derived(this);
  }
}

class TestState extends CollectionState<Derived> {
  itemsCtor = Derived;
}

@Injectable({ providedIn: 'root' })
class TestStateReducer implements IReducer<TestState>{
  stateCtor = TestState;

  reduceAsync(state: TestState, newState: TestState): Promise<TestState> {
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
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

  it('should be created', inject([ReduceStore], (store: ReduceStore) => {
    const items = [
      new Derived({ derivedProp1: 1, derivedProp2: '1', baseProp1: '11', baseProp2: 11 }),
      new Derived({ derivedProp1: 2, derivedProp2: '22', baseProp1: '22', baseProp2: 22 }),
      new Derived({ derivedProp1: 3, derivedProp2: '33', baseProp1: '33', baseProp2: 33 }),
    ];
    const state = new TestState({ items });

    store.reduce(TestStateReducer, state);

    store.getState(TestState).then(s => {
      console.log('Collection Test', s);
    });

    expect(store).toBeTruthy();
  }));
});
