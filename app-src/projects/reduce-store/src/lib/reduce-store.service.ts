import { Injectable, Injector, OnDestroy } from '@angular/core';

import { Observable} from 'rxjs';

import { IClone, IConstructor, ICollection, IReducerConstructor } from './interfaces';
import { ReducerTask } from './classes';
import { Store, setDependecyResolver } from './storage';

@Injectable({ providedIn: 'root' })
export class ReduceStore {
  constructor(
    injector: Injector,
  ) {
    setDependecyResolver(injector);
  }

  getCollectionState<T extends IClone<T>>(stateCtor: IConstructor<ICollection<T>>): Promise<T[]> {
    return Store.getCollectionState(stateCtor);
  }

  getState<T extends IClone<T>>(stateCtor: IConstructor<T>): Promise<T> {
    return Store.getState(stateCtor);
  }

  getObservableState<T extends IClone<T>>(stateCtor: IConstructor<T>): Observable<T> {
    return Store.getObservableState(stateCtor);
  }

  subscribeToState<T extends IClone<T>>(
    stateCtor: IConstructor<T>,
    componentInstance: OnDestroy,
    next: (value: T) => void,
    error: (error: any) => void = () => { },
    complete: () => void = () => { }): void {
    Store.subscribeToState(stateCtor, componentInstance, next, error, complete);
  }

  getObservableStateList<
    T1 extends IClone<T1>,
    T2 extends IClone<T2>,
    T3 extends IClone<T3>,
    T4 extends IClone<T4>,
    T5 extends IClone<T5>,
    T6 extends IClone<T6>>
    (
    state1Ctor: IConstructor<T1>,
    state2Ctor: IConstructor<T2>,
    state3Ctor?: IConstructor<T3>,
    state4Ctor?: IConstructor<T4>,
    state5Ctor?: IConstructor<T5>,
    state6Ctor?: IConstructor<T6>,
  )
    : Observable<[T1, T2, T3, T4, T5, T6]> {
    return Store.getObservableStateList(state1Ctor, state2Ctor, state3Ctor, state4Ctor, state5Ctor, state6Ctor);
  }

  lazyReduce<T extends IClone<T>, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<void> {
    return Store.lazyReduce(reducerCtor, a1, a2, a3, a4, a5, a6);
  }

  reduce<T extends IClone<T>, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<void> {
    return Store.reduce(reducerCtor, a1, a2, a3, a4, a5, a6);
  }

  createReducerTask<T extends IClone<T>, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>,
    delayMilliseconds?: number): ReducerTask<T, A1, A2, A3, A4, A5, A6> {
    return Store.createReducerTask(reducerCtor, delayMilliseconds);
  }

  async removeState<T extends IClone<T>>(stateCtor: IConstructor<T>): Promise<void> {
    return Store.removeState(stateCtor);
  }

  async suspendState<T extends IClone<T>>(stateCtor: IConstructor<T>): Promise<void> {
    return Store.suspendState(stateCtor);
  }

}
