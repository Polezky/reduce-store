import { Injectable } from '@angular/core';

import { Observable, Subject, Subscriber } from 'rxjs';
import { finalize, combineLatest } from 'rxjs/operators';

import { StateData, DeferredGetter, DeferredReducer } from './private-classes';
import { IClone, IConstructor, ICollection, IReducer } from './interfaces';
import { ReducerTask } from './classes';

@Injectable({
  providedIn: 'root'
})
export class ReduceStore {
  private store = new Map<IConstructor<IClone<any>>, StateData<any>>();

  async getCollectionState<T extends IClone<T>>(stateCtor: IConstructor<ICollection<T>>): Promise<T[]> {
    return this.getState(stateCtor).then(x => x.items);
  }

  async getState<T extends IClone<T>>(stateCtor: IConstructor<T>): Promise<T> {
    const stateData = this.getStateData(stateCtor);
    return new Promise<T>((resolve, reject) => {
      const deferred = new DeferredGetter(resolve);
      stateData.deferredGetters.push(deferred);
      this.reduceDeferred(stateCtor);
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
    : Observable<[T1, T2, T3, T4, T5,T6]> {

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

  async lazyReduce<T extends IClone<T>>(reducer: IReducer<T>): Promise<void> {
    return this.internalReduce(reducer, true);
  }

  async reduce<T extends IClone<T>>(reducer: IReducer<T>): Promise<void> {
    return this.internalReduce(reducer, false);
  }

  createReducerTask<T extends IClone<T>>(
    reducerCreator: (...argArray: any[]) => IReducer<T>,
    delayMilliseconds?: number): ReducerTask<T> {
    return new ReducerTask(this.reduce.bind(this), reducerCreator);
  }

  private async internalReduce<T extends IClone<T>>(reducer: IReducer<T>, isDeferred: boolean = false): Promise<void> {
    const stateData = this.getStateData(reducer.stateCtor);
    return new Promise<void>((resolve, reject) => {
      const deferred = new DeferredReducer(reducer, resolve, reject);
      stateData.deferredReducers.push(deferred);
      if (isDeferred) return;
      this.reduceDeferred(reducer.stateCtor);
    });
  }

  private async notifySubscribers<T extends IClone<T>>(stateData: StateData<T>): Promise<void> {
    if (!stateData.subscribers.length) return;
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

  private async reduceDeferred<T extends IClone<T>>(stateCtor: IConstructor<T>, isForced: boolean = false): Promise<void> {
    const stateData = this.getStateData(stateCtor);

    if (stateData.isBusy && !isForced) return;

    const deferredReducer = stateData.deferredReducers.shift();
    if (!deferredReducer) return;

    stateData.isBusy = true;

    const newState = await (deferredReducer.reducer
      .reduceAsync(stateData.state, this.getState.bind(this), this.internalReduce.bind(this))
      .catch(e => {
        deferredReducer.reject();
        return stateData.state;
      })
    );

    stateData.state = this.safeClone(newState);
    deferredReducer.resolve();

    if (stateData.deferredReducers.length) {
      this.reduceDeferred(stateCtor, true);
      return;
    }

    this.resolveDefferedGetters(stateCtor);

    await this.notifySubscribers(stateData);

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
