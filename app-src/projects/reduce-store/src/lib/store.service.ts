import { StoreConfig } from './classes';
import { Store } from './storage';
import { IDependecyResolver } from './interfaces';
import { SimpleDependecyResolver } from './private-classes';

/**
 * This service is a wrapper for the main Store singletone. See docs of Storage class
 * */
export class StoreService {
  constructor(
    resolver: IDependecyResolver = SimpleDependecyResolver,
  ) {
    Store.config.set({ resolver });
  }

  /**
   * This is a wrapper for the Store.config. See docs of Storage class
   * */
  get config(): StoreConfig { return Store.config; }

  /**
   * This is a wrapper for the Store.getEntries. See docs of Storage class
   * */
  getEntries = Store.getEntries.bind(Store);

  /**
   * This is a wrapper for the Store.state. See docs of Storage class
   * */
  get state() { return Store.state; }

  /**
   * This is a wrapper for the Store.reduce. See docs of Storage class
   * */
  get reduce() { return Store.reduce; }

  /**
   * This is a wrapper for the Store.logging. See docs of Storage class
   * */
  get logging() { return Store.logging; }

  /**
   * This is a wrapper for the Store.browserStorage. See docs of Storage class
   * */
  get browserStorage() { return Store.browserStorage; }
}
