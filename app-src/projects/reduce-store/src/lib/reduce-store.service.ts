import { Injectable, Injector, OnDestroy } from '@angular/core';

import { Observable } from 'rxjs';

import { IConstructor, IReducerConstructor, IReducerDelegate } from './interfaces';
import { ReducerTask, StoreConfig } from './classes';
import { Store } from './storage';

/**
 * This service is a wrapper for the main Store singletone. See docs of Storage class
 * */
@Injectable({ providedIn: 'root' })
export class StoreService {
  constructor(
    injector: Injector,
  ) {
    Store.config.set({ disposeMethodName: 'ngOnDestroy', resolver: injector });
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

/**
 * Obsolete, will be remove on the next major version
 * This service is a wrapper for the main Store singletone. See docs for Storage class
 * */
@Injectable({ providedIn: 'root' })
export class ReduceStore {
  constructor(
    injector: Injector,
  ) {
    Store.config.set({ disposeMethodName: 'ngOnDestroy', resolver: injector });
  }

  getEntries(): { stateCtor: IConstructor<any>, stateData: any }[] {
    return Store.getEntries();
  }

  getState<T>(stateCtor: IConstructor<T>): Promise<T> {
    return Store.state.get(stateCtor);
  }

  getObservableState<T>(stateCtor: IConstructor<T>): Observable<T> {
    return Store.state.getObservable(stateCtor);
  }

  subscribeToState<T>(
    stateCtor: IConstructor<T>,
    componentInstance: OnDestroy,
    next: (value: T) => void,
    error: (error: any) => void = () => { },
    complete: () => void = () => { }): void {
    Store.state.subscribe(stateCtor, componentInstance, next, error, complete);
  }

  lazyReduce<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<void> {
    return Store.reduce.byConstructorDeferred(reducerCtor, a1, a2, a3, a4, a5, a6);
  }

  lazyReduceByDelegate<T>(stateCtor: IConstructor<T>, delegate: IReducerDelegate<T>): Promise<void> {
    return Store.reduce.byDelegateDeferred(stateCtor, delegate);
  }

  reduce<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<void> {
    return Store.reduce.byConstructor(reducerCtor, a1, a2, a3, a4, a5, a6);
  }

  reduceByDelegate<T>(stateCtor: IConstructor<T>, delegate: IReducerDelegate<T>): Promise<void> {
    return Store.reduce.byDelegate(stateCtor, delegate);
  }

  createReducerTask<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>,
    delayMilliseconds?: number): ReducerTask<T, A1, A2, A3, A4, A5, A6> {
    return Store.reduce.createReducerTask(reducerCtor, delayMilliseconds);
  }

  async suspendState<T>(stateCtor: IConstructor<T>): Promise<void> {
    return Store.state.suspend(stateCtor);
  }
}
