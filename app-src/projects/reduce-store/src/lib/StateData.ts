import { LogEventType, LogConfig, BrowserStorageConfig } from "./classes";
import { StateSubscriber, DeferredGetter, DeferredReducer } from "./private-classes";
import { KeyValuePair } from "./private-interfaces";
import { stringify, parse } from 'flatted/esm';

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
  browserStorageConfig: BrowserStorageConfig<T> = new BrowserStorageConfig<T>({ isEnabled: false });

  saveStateToBrowserStorage(): void {
    if (!this.browserStorageConfig) return;

    const config = this.browserStorageConfig;

    config.storage.setItem(config.key, stringify(this.state));
  }

  getStateFromBrowserStorage(): T {
    if (!this.browserStorageConfig) return;

    const config = this.browserStorageConfig;

    this.state = parse(config.storage.getItem(config.key));
  }

  hasStateInBrowserStorage(): boolean {
    if (!this.browserStorageConfig) return false;

    const config = this.browserStorageConfig;
    const expirationDate = config.expirationDate;
    const isExpired = expirationDate && expirationDate.getTime() < new Date().getTime();

    if (isExpired) {
      return false;
    }

    const item = config.storage.getItem(config.key);
    return item !== null;
  }

  setBrowserConfig(config: BrowserStorageConfig<T> | Partial<BrowserStorageConfig<T>>): void {
    if (config instanceof BrowserStorageConfig) {
      this.browserStorageConfig = config;
    } else {
      this.browserStorageConfig = new BrowserStorageConfig(config);
    }
  }

}

