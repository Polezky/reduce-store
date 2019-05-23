import { Injectable, Injector, OnDestroy } from '@angular/core';

import { Observable } from 'rxjs';

import { IConstructor, IReducerConstructor, IReducerDelegate } from './interfaces';
import { ReducerTask, LogConfig, LogEventType, AllLogEventTypes } from './classes';
import { Store, setDependecyResolver } from './storage';

@Injectable({ providedIn: 'root' })
export class ReduceStore {
  constructor(
    injector: Injector,
  ) {
    setDependecyResolver(injector);
    Store.config.set({ disposeMethodName: 'ngOnDestroy' });
  }

  getEntries(): { stateCtor: IConstructor<any>, stateData: any }[] {
    return Store.getEntries();
  }

  getState<T>(stateCtor: IConstructor<T>): Promise<T> {
    return Store.getState(stateCtor);
  }

  getObservableState<T>(stateCtor: IConstructor<T>): Observable<T> {
    return Store.getObservableState(stateCtor);
  }

  subscribeToState<T>(
    stateCtor: IConstructor<T>,
    componentInstance: OnDestroy,
    next: (value: T) => void,
    error: (error: any) => void = () => { },
    complete: () => void = () => { }): void {
    Store.subscribeToState(stateCtor, componentInstance, next, error, complete);
  }

  lazyReduce<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<void> {
    return Store.lazyReduce(reducerCtor, a1, a2, a3, a4, a5, a6);
  }

  lazyReduceByDelegate<T>(stateCtor: IConstructor<T>, delegate: IReducerDelegate<T>): Promise<void> {
    return Store.lazyReduceByDelegate(stateCtor, delegate);
  }

  reduce<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<void> {
    return Store.reduce(reducerCtor, a1, a2, a3, a4, a5, a6);
  }

  reduceByDelegate<T>(stateCtor: IConstructor<T>, delegate: IReducerDelegate<T>): Promise<void> {
    return Store.reduceByDelegate(stateCtor, delegate);
  }

  createReducerTask<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>,
    delayMilliseconds?: number): ReducerTask<T, A1, A2, A3, A4, A5, A6> {
    return Store.createReducerTask(reducerCtor, delayMilliseconds);
  }

  async suspendState<T>(stateCtor: IConstructor<T>): Promise<void> {
    return Store.suspendState(stateCtor);
  }
}
