import { Observable, Subscriber, Subscription } from 'rxjs';
import { finalize, combineLatest } from 'rxjs/operators';

import { StateData, DeferredGetter, DeferredReducer, RemoveStateReducer, SimpleDependecyResolver } from './private-classes';
import { IClone, IConstructor, ICollection, IReducerConstructor, IReducer, OnDestroy, IDependecyResolver } from './interfaces';
import { ReducerTask } from './classes';

class Storage {
  private static _instance: Storage;

  static get instance(): Storage {
    return Storage._instance || (Storage._instance = new Storage());
  }

  static setDependecyResolver(resolver: IDependecyResolver): void {
    Storage.instance.dependecyResolver = resolver;
  }

  private dependecyResolver: IDependecyResolver = SimpleDependecyResolver;
  private store = new Map<IConstructor<IClone<any>>, StateData<any>>();
  private subscriptionStore = new Map<OnDestroy, Subscription>();

  private constructor() { }

  getCollectionState<T extends IClone<T>>(stateCtor: IConstructor<ICollection<T>>): Promise<T[]> {
    return this.getState(stateCtor).then(x => x.items);
  }

  getState<T extends IClone<T>>(stateCtor: IConstructor<T>): Promise<T> {
    const stateData = this.getStateData(stateCtor);
    return new Promise<T>((resolve, reject) => {
      const deferred = new DeferredGetter(resolve);
      if (stateData.isStateSuspended) {
        stateData.suspendedGetters.push(deferred);
      } else {
        stateData.deferredGetters.push(deferred);
      }

      this.reduceDeferred(stateCtor, false);

      if (!stateData.isBusy) this.resolveDefferedGetters(stateCtor);
    });
  }

  getObservableState<T extends IClone<T>>(stateCtor: IConstructor<T>): Observable<T> {
    const stateData = this.getStateData(stateCtor);
    const isNeedToNotifySubcriber = stateData.isStateCreated && !stateData.isStateSuspended;

    let subscriber: Subscriber<T>;

    const observable = new Observable<T>(s => {
      subscriber = s;

      if (isNeedToNotifySubcriber) {
        this.getState(stateCtor).then(value => {
          subscriber.next(this.safeClone(value));
          stateData.subscribers.push(subscriber);
        });
      } else {
        stateData.subscribers.push(subscriber);
      }
    })
      .pipe(finalize(() => {
        const stateData = this.store.get(stateCtor);
        const index = stateData.subscribers.findIndex(x => x === subscriber);
        stateData.subscribers.splice(index, 1);
      }));

    return observable;
  }

  subscribeToState<T extends IClone<T>>(
    stateCtor: IConstructor<T>,
    componentInstance: OnDestroy,
    next: (value: T) => void,
    error: (error: any) => void = () => { },
    complete: () => void = () => { }): void {
    const observable = this.getObservableState(stateCtor);
    const newSubscription = observable.subscribe(
      next.bind(componentInstance),
      error.bind(componentInstance),
      complete.bind(componentInstance)
    );
    this.getSubscriptionState(componentInstance).add(newSubscription);

    const originalOnDestroy = componentInstance.ngOnDestroy.bind(componentInstance);
    componentInstance.ngOnDestroy = (): void => {
      this.getSubscriptionState(componentInstance).unsubscribe();
      this.subscriptionStore.delete(componentInstance);
      originalOnDestroy();
    };
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

  /**
   * Adds reducer to the queue and executes it in case there is only this reducer in the queue.
   * @param reducerCtor
   * @param a1
   * @param a2
   * @param a3
   * @param a4
   * @param a5
   * @param a6
   */
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

  async suspendState<T extends IClone<T>>(stateCtor: IConstructor<T>): Promise<void> {
    await this.getState(stateCtor);
    const stateData = this.getStateData(stateCtor);
    stateData.isStateSuspended = true;
  }

  private createReducerAndReduce<T extends IClone<T>, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>, isDeferred: boolean, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<void> {
    const reducer = this.dependecyResolver.get(reducerCtor);
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
    //this.logReducer(deferredReducer, stateData.state);
    try {
      const args = deferredReducer.reducerArgs;
      newState = await deferredReducer.reducer.reduceAsync(stateData.state, ...args);
      stateData.state = this.safeClone(newState);
      stateData.isStateSuspended = false;
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
    let getters = stateData.deferredGetters;
    stateData.deferredGetters = [];

    if (!stateData.isStateSuspended) {
      getters = getters.concat(stateData.suspendedGetters);
      stateData.suspendedGetters = [];
    }

    getters.forEach(g => {
      const cloneState = this.safeClone(stateData.state);
      g.resolve(cloneState);
    });
  }

  private safeClone(state: IClone<any> | undefined): any {
    if (state === undefined) return undefined;
    return state.clone();
  }

  private getSubscriptionState(componentInstance: OnDestroy): Subscription {
    let subscription = this.subscriptionStore.get(componentInstance);
    if (subscription) return subscription;

    subscription = new Subscription();
    this.subscriptionStore.set(componentInstance, subscription);
    return subscription;
  }

}

export enum LogType {
  None = 0,
  Reducer = 1 << 0,
  ReducerData = 1 << 1
}

export class Logger {
  private logLevelFunction = console.log.bind(window.console);

  logPrefix = 'ReduceStore';
  logType: LogType;
  style: 'color: greeen;';

  logReducer(deferredReducer: DeferredReducer<any>, state: any): void {
    if (!this.logType) return;

    if ((this.logType & LogType.Reducer) > 0) {
      let logData: any;
      if ((this.logType & LogType.ReducerData) > 0) {
        logData = {
          reducer: deferredReducer.reducer,
          args: deferredReducer.reducerArgs,
          state: state
        };
      } else {
        logData = deferredReducer.reducer;
      }

      this.log(logData);
    }
  }

  private log(logData: any): void {

  }


}

export const Store: Storage = Storage.instance;

export function setDependecyResolver(resolver: IDependecyResolver): void {
  Storage.setDependecyResolver(resolver);
}

/*
prefix: ReduceStore
filterByStates
time, timeEnd
log, info, warn, trace
color
group, groupCollapsed, groupEnd

events: reduce, stateGetter, subscriberNotification, subscriberAdded, subscriberRemoved
dataDetails: EventName, EventWithData
*/