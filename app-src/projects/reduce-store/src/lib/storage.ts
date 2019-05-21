import { Observable, Subscriber, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { DeferredGetter, DeferredReducer, SimpleDependecyResolver, StateSubscriber } from './private-classes';
import { StateData } from "./StateData";
import { IConstructor, IReducerConstructor, IReducer, IDependecyResolver, IReducerDelegate } from './interfaces';
import { ReducerTask, AllLogEventTypes, StoreConfig } from './classes';
import { LogConfig, LogEventType } from './classes';
import * as logging from './logging';

class Storage {
  private static _instance: Storage;

  static get instance(): Storage {
    return Storage._instance || (Storage._instance = new Storage());
  }

  static setDependecyResolver(resolver: IDependecyResolver): void {
    Storage.instance.dependecyResolver = resolver;
  }

  private dependecyResolver: IDependecyResolver = SimpleDependecyResolver;
  private store = new Map<IConstructor<any>, StateData<any>>();
  private subscriptionStore = new Map<{}, Subscription>();
  private config: StoreConfig = new StoreConfig();

  private constructor() { }

  configureStore(config: StoreConfig): void {
    this.config = new StoreConfig(config);
  }

  getEntries(): { stateCtor: IConstructor<any>, stateData: StateData<any> }[] {
    return Array.from(this.store.entries()).map(x => {
      return {
        stateCtor: x[0],
        stateData: x[1]
      };
    });
  }

  getState<T>(stateCtor: IConstructor<T>): Promise<T> {
    const stateData = this.getStateData(stateCtor);
    logging.LogManager.log(stateCtor, LogEventType.StateGetter, stateData, { state: stateData.state });

    const logger = new logging.DurationLogger(stateCtor);
    return this.internalGetState(stateCtor, logger);
  }

  getObservableState<T>(stateCtor: IConstructor<T>): Observable<T> {
    const logger = new logging.Logger(stateCtor);
    return this.internalGetObservableState(stateCtor, logger);
  }

  subscribeToState<T>(
    stateCtor: IConstructor<T>,
    componentInstance: {},
    next: (value: T) => void,
    error: (error: any) => void = () => { },
    complete: () => void = () => { }): void {
    const logger = new logging.Logger(stateCtor);
    const observable = this.internalGetObservableState(stateCtor, logger);
    const newSubscription = observable.subscribe(
      next.bind(componentInstance),
      error.bind(componentInstance),
      complete.bind(componentInstance)
    );

    if (!this.config || !this.config.disposeMethodName)
      throw new Error('disposeMethodName is not configured');

    if (typeof componentInstance[this.config.disposeMethodName] !== 'function')
      throw new Error(`componentInstance does not have method ${this.config.disposeMethodName}`);

    this.getSubscriptionState(componentInstance).add(newSubscription);

    const originalOnDestroy = componentInstance[this.config.disposeMethodName].bind(componentInstance);
    componentInstance[this.config.disposeMethodName] = (): void => {
      this.getSubscriptionState(componentInstance).unsubscribe();
      this.subscriptionStore.delete(componentInstance);
      originalOnDestroy();
    };
  }

  lazyReduce<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<void> {
    return this.createReducerAndReduce(reducerCtor, true, a1, a2, a3, a4, a5, a6);
  }

  lazyReduceByDelegate<T>(stateCtor: IConstructor<T>, delegate: IReducerDelegate<T>): Promise<void> {
    const logger = new logging.Logger(stateCtor);
    return this.internalReduceByDelegate(stateCtor, delegate, true, logger);
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
  reduce<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<void> {
    return this.createReducerAndReduce(reducerCtor, false, a1, a2, a3, a4, a5, a6);
  }

  reduceByDelegate<T>(stateCtor: IConstructor<T>, delegate: IReducerDelegate<T>): Promise<void> {
    const logger = new logging.Logger(stateCtor);
    return this.internalReduceByDelegate(stateCtor, delegate, false, logger);
  }

  createReducerTask<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>,
    delayMilliseconds?: number): ReducerTask<T, A1, A2, A3, A4, A5, A6> {

    return new ReducerTask(this.reduce.bind(this), reducerCtor, delayMilliseconds);
  }

  async suspendState<T>(stateCtor: IConstructor<T>): Promise<void> {
    const stateData = this.getStateData(stateCtor);

    const logger = new logging.Logger(stateCtor);

    const state = await this.internalGetState(stateCtor);
    stateData.isStateSuspended = true;

    logger.log(LogEventType.StateSuspended, stateData, { state: state });
  }

  configureLogging(stateCtors: IConstructor<any>[], eventType: LogEventType = AllLogEventTypes, config: Partial<LogConfig> = {}): void {
    const newPairs = logging.getLogConfigPairs(eventType, config);
    if (stateCtors.length) {
      stateCtors.forEach(stateCtor => {
        const stateData = this.getStateData(stateCtor);
        stateData.logConfigPairs = logging.getUpdatedLogConfigPairs(stateData.logConfigPairs, newPairs);
      })
    } else {
      logging.LogManager.allStatesConfigPairs = logging.getUpdatedLogConfigPairs(logging.LogManager.allStatesConfigPairs, newPairs);
    }
  }

  resetLoggingConfiguration(): void {
    logging.LogManager.allStatesConfigPairs = [];
    const stateDataList = Array.from(this.store.values());
    for (let stateData of stateDataList) {
      stateData.logConfigPairs = [];
    }
  }

  turnLogging(mode: 'on' | 'off'): void {
    logging.LogManager.isEnabled = mode == 'on';
  }

  private internalGetState<T>(stateCtor: IConstructor<T>, logger?: logging.DurationLogger<T>): Promise<T> {
    const stateData = this.getStateData(stateCtor);
    return new Promise<T>((resolve, reject) => {
      const deferred = new DeferredGetter(resolve, logger);
      if (stateData.isStateSuspended) {
        stateData.suspendedGetters.push(deferred);
      } else {
        stateData.deferredGetters.push(deferred);
      }

      this.reduceDeferred(stateCtor, false);

      if (!stateData.isBusy) this.resolveDefferedGetters(stateCtor);
    });
  }

  private internalGetObservableState<T>(stateCtor: IConstructor<T>, logger: logging.Logger<T>): Observable<T> {
    const stateData = this.getStateData(stateCtor);
    const isNeedToNotifySubcriber = stateData.isStateInitiated && !stateData.isStateSuspended;

    let subscriber: Subscriber<T>;

    const observable = new Observable<T>(s => {
      subscriber = s;

      logger.log(LogEventType.SubscriberAdded, stateData, { state: stateData.state });

      if (isNeedToNotifySubcriber) {
        this.internalGetState(stateCtor).then(value => {
          logger.log(LogEventType.SubscriberNotification, stateData, { state: stateData.state });

          subscriber.next(this.safeClone(value));
          stateData.subscribers.push(new StateSubscriber(subscriber, logger));
        });
      } else {
        stateData.subscribers.push(new StateSubscriber(subscriber, logger));
      }
    })
      .pipe(finalize(() => {
        const stateData = this.store.get(stateCtor);
        logger.log(LogEventType.SubscriberRemoved, stateData, { state: stateData.state });

        const index = stateData.subscribers.findIndex(x => x.subscriber === subscriber);
        stateData.subscribers.splice(index, 1);
      }));

    return observable;
  }

  private createReducerAndReduce<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>, isDeferred: boolean, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<void> {
    const reducer = this.dependecyResolver.get(reducerCtor);
    const logger = new logging.Logger(reducer.stateCtor);
    return this.internalReduce(reducer, isDeferred, logger, a1, a2, a3, a4, a5, a6);
  }

  private internalReduceByDelegate<T>(stateCtor: IConstructor<T>, delegate: IReducerDelegate<T>, isDeferred: boolean, logger: logging.Logger<T>): Promise<void> {
    const stateData = this.getStateData(stateCtor);
    const reducerLogger = new logging.ReducerLogger(stateCtor);
    stateData.isStateInitiated = true;
    return new Promise<void>((resolve, reject) => {
      const deferred = new DeferredReducer({ delegate, resolve, reject, logger: reducerLogger });
      stateData.deferredReducers.push(deferred);

      if (isDeferred) {
        logger.log(LogEventType.LazyReduceByDelegate, stateData, { state: stateData.state });
      } else {
        logger.log(LogEventType.ReduceByDelegate, stateData, { state: stateData.state });
        this.reduceDeferred(stateCtor, false);
      }
    });
  }

  private internalReduce<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
    reducer: IReducer<T, A1, A2, A3, A4, A5, A6>, isDeferred: boolean, logger: logging.Logger<T>, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<void> {
    const stateData = this.getStateData(reducer.stateCtor);
    const reducerLogger = new logging.ReducerLogger(reducer.stateCtor);
    stateData.isStateInitiated = true;
    return new Promise<void>((resolve, reject) => {
      const args = [a1, a2, a3, a4, a5, a6];
      const deferred = new DeferredReducer({ reducer, args, resolve, reject, logger: reducerLogger });
      stateData.deferredReducers.push(deferred);

      if (isDeferred) {
        logger.log(LogEventType.LazyReducer, stateData, { state: stateData.state, args });
      } else {
        logger.log(LogEventType.Reducer, stateData, { state: stateData.state, args });
        this.reduceDeferred(reducer.stateCtor, false);
      }
    });
  }

  private notifySubscribers<T>(stateData: StateData<T>): void {
    const value = stateData.state;
    for (let subscriber of stateData.subscribers) {
      const cloneValue = this.safeClone(value) as T;
      subscriber.logger.log(LogEventType.SubscriberNotification, stateData, { state: cloneValue })
      subscriber.subscriber.next(cloneValue);
    }
  }

  private getStateData<T>(stateCtor: IConstructor<T>): StateData<T> {
    let stateData = this.store.get(stateCtor) as StateData<T>;
    if (stateData) return stateData;

    stateData = new StateData();
    this.store.set(stateCtor, stateData);
    return stateData;
  }

  private async reduceDeferred<T>(stateCtor: IConstructor<T>, isForced: boolean): Promise<void> {
    const stateData = this.getStateData(stateCtor);

    if (stateData.isBusy && !isForced) return;

    const deferredReducer = stateData.deferredReducers.shift();
    if (!deferredReducer) return;

    stateData.isBusy = true;

    let newState: T;
    let error;
    let promise: Promise<any>;

    if (deferredReducer.reducer) {
      const args = deferredReducer.args;
      promise = deferredReducer.reducer
        .reduceAsync(stateData.state, ...args)
        .then(x => newState = x)
        .catch(e => error = e);
    } else if (deferredReducer.delegate) {
      promise = deferredReducer
        .delegate(stateData.state)
        .then(x => newState = x)
        .catch(e => error = e);
    } else {
      throw new Error('No reducer or delegate');
    }

    deferredReducer.logger.startRunWatches();
    await promise;
    deferredReducer.logger.stopRunWatches();

    stateData.isStateSuspended = false;
    stateData.state = this.safeClone(newState);

    if (error) {
      deferredReducer.logger.log(LogEventType.ReducerRejected, stateData, { state: stateData.state, args: deferredReducer.args })
      deferredReducer.reject(error);
    } else {
      deferredReducer.logger.log(LogEventType.ReducerResolved, stateData, { state: stateData.state, args: deferredReducer.args })
      deferredReducer.resolve();
    }

    if (stateData.deferredReducers.length) {
      this.reduceDeferred(stateCtor, true);
      return;
    }

    this.resolveDefferedGetters(stateCtor);

    this.notifySubscribers(stateData);

    stateData.isBusy = false;
  }

  private resolveDefferedGetters<T>(stateCtor: IConstructor<T>): void {
    const stateData = this.getStateData(stateCtor);
    let getters = stateData.deferredGetters;
    stateData.deferredGetters = [];

    if (!stateData.isStateSuspended) {
      getters = getters.concat(stateData.suspendedGetters);
      stateData.suspendedGetters = [];
    }

    getters.forEach(g => {
      const cloneState = this.safeClone(stateData.state) as T;
      if (g.logger) {
        g.logger.log(LogEventType.StateGetterResolved, stateData, { state: cloneState })
      }

      g.resolve(cloneState);
    });
  }

  private safeClone(state: any | undefined): any {
    if (state === undefined) return undefined;
    if (state === null) return null;
    if (!this.config || !this.config.cloneMethodName) return state;
    return state[this.config.cloneMethodName]();
  }

  private getSubscriptionState(componentInstance: {}): Subscription {
    let subscription = this.subscriptionStore.get(componentInstance);
    if (subscription) return subscription;

    subscription = new Subscription();
    this.subscriptionStore.set(componentInstance, subscription);
    return subscription;
  }
}

export const Store: Storage = Storage.instance;

export function setDependecyResolver(resolver: IDependecyResolver): void {
  Storage.setDependecyResolver(resolver);
}
