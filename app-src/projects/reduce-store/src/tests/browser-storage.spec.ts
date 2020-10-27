import { TestBed, inject } from '@angular/core/testing';

import { Clone, IBrowserStorage } from 'reduce-store';
import { parse } from 'flatted/esm';
import { NgStoreService } from './NgStoreService';

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

describe('StoreService: Browser storage functionality', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NgStoreService]
    });
  });

  it('should be created', inject([NgStoreService], async (store: NgStoreService) => {
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
