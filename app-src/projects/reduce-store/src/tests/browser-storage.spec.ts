import { TestBed, inject } from '@angular/core/testing';

import { StoreService } from '../lib/reduce-store.service';
import { Clone, BrowserStorageConfig } from 'reduce-store';
import { stringify, parse } from 'flatted/esm';

class TestState extends Clone<TestState> {
  static storageConfig: Partial<BrowserStorageConfig> = { key: 'TestState', type: 'localStorage' };

  value: number;
}

function createTestState(value: number): Promise<TestState> {
  return Promise.resolve(new TestState({ value }));
}

describe('ReduceStore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StoreService]
    });
  });

  it('should be created', inject([StoreService], async (store: StoreService) => {
    window['parse'] = parse;
    window['stringify'] = stringify;

    const testState = { value: -1 };
    const stringified = stringify(testState);
    const parsed = parse(stringified);
    console.log(stringified, parsed);

    store.browserStorage.configureByDelegateDeferred(TestState.storageConfig, TestState, s => createTestState(-1));
    store.browserStorage.configureByDelegateDeferred(TestState2.storageConfig, TestState2, s => createTestState2(-1));
    store.state.get(TestState2);

    //store.state.getObservable(TestState).subscribe(x => {
    //  console.log({ TestState: x });
    //});

    const state = await store.state.get(TestState);

    const storageStateItem = localStorage.getItem(TestState.storageConfig.key);
    const storageState = new TestState(JSON.parse(storageStateItem));

    console.log({ state, storageState });

    ////store.reduce(TestStateErrorReducer, "-1");

    //store.reduce(TestStateReducer, 3);

    //store.getObservableState(TestState).subscribe(x => {
    //  console.log('getObservableState 2', x);
    //});

    //store.getState(TestState)
    //  .then(x => {
    //    console.log('getState 2', x);
    //  })
    //  .catch(e => {
    //    console.log('error in getState 2', e);
    //  });

    //expect(state.value).toBeTruthy(storageState.value);
    expect(store).toBeTruthy();
  }));
});
