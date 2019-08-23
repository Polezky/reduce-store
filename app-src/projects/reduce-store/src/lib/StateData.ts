import { LogEventType, LogConfig, BrowserStorage } from "./classes";
import { StateSubscriber, DeferredGetter, DeferredReducer } from "./private-classes";
import { KeyValuePair } from "./private-interfaces";
import { IBrowserStorage } from './interfaces';

export class StateData<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null> {
  state: T;
  subscribers: Array<StateSubscriber<T>> = [];
  isBusy: boolean = false;
  isStateInitiated: boolean = false;
  isStateSuspended: boolean = false;
  deferredGetters: Array<DeferredGetter<T>> = [];
  suspendedGetters: Array<DeferredGetter<T>> = []; // getters that came after state was suspended
  deferredReducers: Array<DeferredReducer<T, A1, A2, A3, A4, A5, A6>> = [];
  logConfigPairs: KeyValuePair<LogEventType, LogConfig>[] = [];
  browserStorage: BrowserStorage<T> = new BrowserStorage<T>({
    key: undefined,
    stateCtor: undefined,
    isEnabled: false,
    deferredDelegate: undefined
  });

  setBrowserStorage(config: BrowserStorage<T> | IBrowserStorage<T>): void {
    if (config instanceof BrowserStorage) {
      this.browserStorage = config;
    } else {
      this.browserStorage = new BrowserStorage(config);
    }
  }

}

