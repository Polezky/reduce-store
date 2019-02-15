import { Injectable, Injector } from '@angular/core';

import { Observable, Subscriber } from 'rxjs';
import { finalize, combineLatest } from 'rxjs/operators';

import { StateData, DeferredGetter, DeferredReducer, RemoveStateReducer } from './private-classes';
import { IClone, IConstructor, ICollection, IReducerConstructor, IReducer } from './interfaces';
import { ReducerTask } from './classes';

@Injectable({ providedIn: 'root' })
export class ReduceStore {
  private store = new Map<IConstructor<IClone<any>>, StateData<any>>();

  constructor(
    private injector: Injector,
  ) {}

  getCollectionState<T extends IClone<T>>(stateCtor: IConstructor<ICollection<T>>): Promise<T[]> {
    return this.getState(stateCtor).then(x => x.items);
  }

  getState<T extends IClone<T>>(stateCtor: IConstructor<T>): Promise<T> {
    const stateData = this.getStateData(stateCtor);
    return new Promise<T>((resolve, reject) => {
      const deferred = new DeferredGetter(resolve);
      stateData.deferredGetters.push(deferred);
      this.reduceDeferred(stateCtor, false);
      if (!stateData.isBusy) this.resolveDefferedGetters(stateCtor);
    });
  }

  getObservableState<T extends IClone<T>>(stateCtor: IConstructor<T>): Observable<T> {
    const stateData = this.getStateData(stateCtor);
    let subscriber: Subscriber<T>;

    const observable = new Observable<T>(observer => {
      subscriber = observer;
      this.getState(stateCtor).then(value => {
        subscriber.next(this.safeClone(value));
        stateData.subscribers.push(subscriber);
      });
    })
      .pipe(finalize(() => {
        const stateData = this.store.get(stateCtor);
        const index = stateData.subscribers.findIndex(x => x === subscriber);
        stateData.subscribers.splice(index, 1);
      }));

    return observable;
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

    const result: [T1, T2, T3, T4, T5, T6] = [
      undefined as T1,
      undefined as T2,
      undefined as T3,
      undefined as T4,
      undefined as T5,
      undefined as T6,
    ];

    const o1 = this.getObservableState(state1Ctor);

    const o2 = this.getObservableState(state2Ctor);
    if (!state3Ctor)
      return o1.pipe(combineLatest(o2, (state1, state2) => {
        result[0] = state1;
        result[1] = state2;
        return result;
      }));

    const o3 = this.getObservableState(state3Ctor);
    if (!state4Ctor)
      return o1.pipe(combineLatest(o2, o3, (state1, state2, state3) => {
        result[0] = state1;
        result[1] = state2;
        result[2] = state3;
        return result;
      }));

    const o4 = this.getObservableState(state4Ctor);
    if (!state5Ctor)
      return o1.pipe(combineLatest(o2, o3, o4, (state1, state2, state3, state4) => {
        result[0] = state1;
        result[1] = state2;
        result[2] = state3;
        result[3] = state4;
        return result;
      }));

    const o5 = this.getObservableState(state5Ctor);
    if (!state6Ctor)
      return o1.pipe(combineLatest(o2, o3, o4, o5, (state1, state2, state3, state4, state5) => {
        result[0] = state1;
        result[1] = state2;
        result[2] = state3;
        result[3] = state4;
        result[4] = state5;
        return result;
      }));

    const o6 = this.getObservableState(state6Ctor);
    return o1.pipe(combineLatest(o2, o3, o4, o5, o6, (state1, state2, state3, state4, state5, state6) => {
      result[0] = state1;
      result[1] = state2;
      result[2] = state3;
      result[3] = state4;
      result[4] = state5;
      result[5] = state6;
      return result;
    }));
  }

  lazyReduce<T extends IClone<T>, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<void> {
    return this.createReducerAndReduce(reducerCtor, true, a1, a2, a3, a4, a5, a6);
  }

  reduce<T extends IClone<T>, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<void> {
    return this.createReducerAndReduce(reducerCtor, false, a1, a2, a3, a4, a5, a6);
  }

  createReducerTask<T extends IClone<T>, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>,
    delayMilliseconds?: number): ReducerTask<T, A1, A2, A3, A4, A5, A6> {

    return new ReducerTask(this.reduce.bind(this), reducerCtor, delayMilliseconds);
  }

  async removeState<T extends IClone<T>>(stateCtor: IConstructor<T>): Promise<void> {
    const reducer = new RemoveStateReducer();
    reducer.stateCtor = stateCtor;
    return this.internalReduce(reducer, false);
  }

  private createReducerAndReduce<T extends IClone<T>, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>, isDeferred: boolean, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<void> {
    const reducer = this.injector.get(reducerCtor);
    return this.internalReduce(reducer, isDeferred, a1, a2, a3, a4, a5, a6);
  }

  private internalReduce<T extends IClone<T>, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducer: IReducer<T, A1, A2, A3, A4, A5, A6>, isDeferred: boolean, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<void> {
    const stateData = this.getStateData(reducer.stateCtor);
    return new Promise<void>((resolve, reject) => {
      const args = [a1, a2, a3, a4, a5, a6];
      const deferred = new DeferredReducer(reducer, args, resolve, reject);
      stateData.deferredReducers.push(deferred);
      if (isDeferred) return;
      this.reduceDeferred(reducer.stateCtor, false);
    });
  }

  private notifySubscribers<T extends IClone<T>>(stateData: StateData<T>): void {
    const value = stateData.state;
    for (let subscriber of stateData.subscribers) {
      const cloneValue = this.safeClone(value);
      subscriber.next(cloneValue);
    }
  }

  private getStateData<T extends IClone<T>>(stateCtor: IConstructor<T>): StateData<T> {
    let stateData = this.store.get(stateCtor) as StateData<T>;
    if (stateData) return stateData;

    stateData = new StateData();
    this.store.set(stateCtor, stateData);
    return stateData;
  }

  private async reduceDeferred<T extends IClone<T>>(stateCtor: IConstructor<T>, isForced: boolean): Promise<void> {
    const stateData = this.getStateData(stateCtor);

    if (stateData.isBusy && !isForced) return;

    const deferredReducer = stateData.deferredReducers.shift();
    if (!deferredReducer) return;

    stateData.isBusy = true;

    let newState: T;
    try {
      const args = deferredReducer.reducerArgs;
      newState = await deferredReducer.reducer.reduceAsync(stateData.state, ...args);
      stateData.state = this.safeClone(newState);
      deferredReducer.resolve();
    } catch (e) {
      deferredReducer.reject(e);
    }

    if (stateData.deferredReducers.length) {
      this.reduceDeferred(stateCtor, true);
      return;
    }

    this.resolveDefferedGetters(stateCtor);

    this.notifySubscribers(stateData);

    stateData.isBusy = false;
  }

  private resolveDefferedGetters<T extends IClone<T>>(stateCtor: IConstructor<T>): void {
    const stateData = this.getStateData(stateCtor);
    stateData.deferredGetters.forEach(g => {
      const cloneState = this.safeClone(stateData.state);
      g.resolve(cloneState);
    });
    stateData.deferredGetters = [];
  }

  private safeClone(state: IClone<any> | undefined): any {
    if (state === undefined) return undefined;
    return state.clone();
  }
}
