import { TestBed, inject } from '@angular/core/testing';

import { StoreService } from '../lib/reduce-store.service';
import { Clone, IBrowserStorage } from 'reduce-store';
import { parse } from 'flatted/esm';

class TestState extends Clone<TestState> {
  value: number;
}

const storageConfig: IBrowserStorage<TestState> = {
  key: 'TestState',
  deferredDelegate: s => createTestState(-1),
  stateCtor: TestState,
};

function createTestState(value: number): Promise<TestState> {
  return Promise.resolve(new TestState({ value }));
}

describe('ReduceStore: Browser storage functionality', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StoreService]
    });
  });

  it('should be created', inject([StoreService], async (store: StoreService) => {
    store.browserStorage.configure(storageConfig);

    let state = await store.state.get(TestState);

    //store.reduce.byDelegate(TestState, s => createTestState(1));

    //state = await store.state.get(TestState);

    const storageStateItem = localStorage.getItem(storageConfig.key);
    const storageState = new TestState(parse(storageStateItem));

    console.log({ state, storageState });

    expect(state.value).toBeTruthy(storageState.value);
  }));
});
