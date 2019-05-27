import { Observable, Subscriber, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { DeferredGetter, DeferredReducer, StateSubscriber } from './private-classes';
import { StateData } from "./StateData";
import { IConstructor, IReducerConstructor, IReducer, IReducerDelegate } from './interfaces';
import { ReducerTask, AllLogEventTypes, StoreConfig } from './classes';
import { LogConfig, LogEventType } from './classes';
import * as logging from './logging';

class Storage {
  private static _instance: Storage;

  static get instance(): Storage {
    return Storage._instance || (Storage._instance = new Storage());
  }

  private store = new Map<IConstructor<any>, StateData<any>>();
  private subscriptionStore = new Map<{}, Subscription>();

  /**
   * A set of configuration properties of the Store
   * See more details in StoreConfig class
   * */
  readonly config: StoreConfig = new StoreConfig();

  private constructor() { }

  /**
   * Returns all entries of the State map.
   * Every entry has two properties: stateCtor and stateData.
   * stateCtor is the state constructor used as a map key.
   * stateData is a container for all data stored for particular state constructor including current state object.
   * */
  getEntries(): { stateCtor: IConstructor<any>, stateData: StateData<any> }[] {
    return Array.from(this.store.entries()).map(x => {
      return {
        stateCtor: x[0],
        stateData: x[1]
      };
    });
  }

  /**
   * An object which contains operations over states
  * */
  state = {

    /**
     * Returns a Promise of a State.
     *
     * If there is no pending reducers for the state and state is not suspended, then Promise is resolved immediatelly.
     * A state can be suspended by call of suspend method.
     *
     * If there is pending reducers including deferred reducers, then the Store waits when all reducers are resolved.
     * Then the Store starts to resolve promises of Getters in a queue.
     *
     * param stateCtor - constructor function of a state.
     * */
    get: <T>(stateCtor: IConstructor<T>): Promise<T> => {
      const stateData = this.getStateData(stateCtor);
      logging.LogManager.log(stateCtor, LogEventType.StateGetter, stateData, { state: stateData.state });

      const logger = new logging.DurationLogger(stateCtor);
      return this.internalGetState(stateCtor, logger);
    },

    /**
     * Returns an Observable of a State.
     * This method adds a new Observable subscriber for a given stateCtor.
     *
     * If the state has been initated and is not suspended then the next method of returned Observable subscriber is called right after this method is called.
     * A state is initiated when a reducer or deferred reducer is applied.
     * A state can be suspended by call of suspend method. 
     *
     * The next method of Observable subscriber is called every time when a reducer promise of the state is resolved.
     *
     * param stateCtor - constructor function of the state.
     * */
    getObservable: <T>(stateCtor: IConstructor<T>): Observable<T> => {
      const logger = new logging.Logger(stateCtor);
      return this.internalGetObservableState(stateCtor, logger);
    },

    /**
     * Subscribes component to changes of a state by wrapping component dispose method.
     * Dispose method name is set in Store.config.disposeMethodName.
     * Component have to have a function with name equals disposeMethodName of StoreConfig class
     * This method gets the observable using getObservable method.
     * When the component dispose method is called then Store unsubscribes the subscription and calls original dispose method.
     *
     * param stateCtor - constructor function of the state.
     * param componentInstance - instance of a component which has dispose method
     * param next - a function which is called when the state is changed.
     * param error - a function which is called when error occurs while notificate about the state changes.
     * param complete - a function which is called when observable of subscription is completed that is before origianl dispose method call.
     * */
    subscribe: <T>(
      stateCtor: IConstructor<T>,
      componentInstance: {},
      next: (value: T) => void,
      error: (error: any) => void = () => { },
      complete: () => void = () => { }): void => {

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
    },

    /**
     * Returns a Promise which is resolved when the state is suspended.
     * If the state is suspended then promises of new state getters will not be resolved until any reducer is called. 
     * If the state is suspended then new state subscribers will not be notified until any reducer promise is resolved or rejected.
     * New subscribers are added using getObservable and subscribe methods.
     * If before call of this methods there are pending reducers, getters or subscribers
     * then this method waits untill all of those a resolved and then make state suspended.
     *
     * param stateCtor - constructor function of a state.
     * */
    suspend: async<T>(stateCtor: IConstructor<T>): Promise<void> => {
      const stateData = this.getStateData(stateCtor);

      const logger = new logging.Logger(stateCtor);

      const state = await this.internalGetState(stateCtor);
      stateData.isStateSuspended = true;

      logger.log(LogEventType.StateSuspended, stateData, { state: state });
    }

  };

  /**
   * An object which contains methods to change a state
   * All these methods use the same queue of reducers.
   * */
  reduce = {

    /**
     * Returns a promise which is resolved when the promise of reducer's reduceAsync method is resolved.
     * The value of new state will be the value resolved by reducer's reduceAsync method.
     * This method promise is rejected if the promise of reducer's reduceAsync method is rejected. In this case state is not changed and
     * state getter promises will receive current state value and state subscribers will be notified with current state value.
     * If there are pending reducers then this reducer will be executed after these redusers are resolved/rejected
     * but before any state getters and subscriber notifications
     *
     * The reducer instance is created using configured resolver. This is a property of StoreConfig class. The reducer is instantiated during
     * this method call. So when this method returns a Promise the reducer is created already. This happens before resolve/reject of this
     * method promise.
     * 
     * If state is suspended then state will be un-suspended after the promise of reduceAsync method is resolved or rejectd.
     *
     * param reducerCtor is a contructor function of a reducer which reduceAsync method will be executed.
     * when reduceAsync method is called it receives current state as first argument and upto 6 optional arguments.
     * param a1 is the second argument which will be passed to reducer's reduceAsync method. 
     * param a2 is the third argument which will be passed to reducer's reduceAsync method.
     * param a3 is the fourth argument which will be passed to reducer's reduceAsync method.
     * param a4 is the fifth argument which will be passed to reducer's reduceAsync method.
     * param a5 is the sixth argument which will be passed to reducer's reduceAsync method.
     * param a6 is the seventh argument which will be passed to reducer's reduceAsync method.
     * */
    byConstructor: <T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
      reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<void> => {
      return this.createReducerAndReduce(reducerCtor, false, a1, a2, a3, a4, a5, a6);
    },

    /**
     * Returns a promise which is resolved when the promise of reducer's reduceAsync method is resolved.
     *
     * This method works like byConstructor. The difference is that in case there is no pending reducers then this reducer
     * will not be executed immediatelly but instead will be put in a reducers queue. So it will be first in the queue.
     * This reducer will be executed upon call of the following methods: state.get, state.getObservable, state.subscribe and
     * all reduce methods.
     * If before this method call there are pending reducers, then this method will be put in a queue and there will be no
     * difference with byConstructor method.
     * 
     * The main purpose of this method to create a method cache on application start. So that in case some state is neededed
     * then this reducer will be executed to provide the state. It make sense for the data which is changed rarely and is needed
     * to be loaded once or never.
     *
     * param reducerCtor is a contructor function of a reducer which reduceAsync method will be executed.
     * when reduceAsync method is called it receives current state as first argument and upto 6 optional arguments.
     * param a1 is the second argument which will be passed to reducer's reduceAsync method. 
     * param a2 is the third argument which will be passed to reducer's reduceAsync method.
     * param a3 is the fourth argument which will be passed to reducer's reduceAsync method.
     * param a4 is the fifth argument which will be passed to reducer's reduceAsync method.
     * param a5 is the sixth argument which will be passed to reducer's reduceAsync method.
     * param a6 is the seventh argument which will be passed to reducer's reduceAsync method.
     * */
    byConstructorDeferred: <T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
      reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<void> => {
      return this.createReducerAndReduce(reducerCtor, true, a1, a2, a3, a4, a5, a6);
    },

    /**
     * Returns a promise which is resolved when the promise of delegate is resolved.
     * This method promise is rejected if the promise delegate is rejected.
     *
     * The value of new state will be the value resolved by delegate promise.
     * This method promise is rejected if the delegate promise is rejected. In this case state is not changed and reducers queue process
     * proceeds.
     *
     * This methods works like byConstructor method. The difference is that no reducer instance is created.
     * The new state equals the resolved value of the delegate
     *
     * param stateCtor - constructor function of a state.
     * param delegate - an implementation of IReducerDelegate<T> interface. That is an anonymous function which accepts current
     * state and return Promise of new state
     * */
    byDelegate: <T>(stateCtor: IConstructor<T>, delegate: IReducerDelegate<T>): Promise<void> => {
      const logger = new logging.Logger(stateCtor);
      return this.internalReduceByDelegate(stateCtor, delegate, false, logger);
    },

    /**
     * Returns a promise which is resolved when the delegate promise is resolved.
     *
     * This method works like byDelegate. The difference is that in case there is no pending reducers then this delegate
     * will not be executed immediatelly but instead will be put in a reducers queue. So it will be first in the queue.
     * This delegate will be executed upon call of the following methods: state.get, state.getObservable, state.subscribe and
     * all reduce methods.
     * If before this method call there are pending reducers, then the delegate will be put in a queue and there will be no
     * difference with byDelegate method.
     * 
     * The main purpose of this method to create a method cache on application start. So that in case some state is neededed
     * then the delegate will be executed to provide the state. It make sense for the data which is changed rarely and is needed
     * to be loaded once or never.
     *
     * param stateCtor - constructor function of a state.
     * param delegate - an implementation of IReducerDelegate<T> interface. That is an anonymous function which accepts current
     * state and return Promise of new state
     * */
    byDelegateDeferred: <T>(stateCtor: IConstructor<T>, delegate: IReducerDelegate<T>): Promise<void> => {
      const logger = new logging.Logger(stateCtor);
      return this.internalReduceByDelegate(stateCtor, delegate, true, logger);
    },

    /**
     * Creates a reducer task. This task executes the given reducer's reduceAsync methods in the given amout of delay milliseconds
     * This is useful when there is a need to execute one action as a reaction to multiple single-type actions.
     * This task could be used in case there is a need to call server as a reaction for user typing. So one call of
     * server will be executed if user press key multiple time within 300 milliseconds.
     * The example of usage:
     * 1. Implement a reducer which implements IReducer<T> interface
     * 2. Create an instance of the reducer task by calling Store.reduce.createReducerTask
     *    e.g. task = Store.reduce.createReducerTask(Reducer, delay)
     * 3. subscribe to multiple single-type actions
     *    e.g. window.onresize(task.execute)
     * param reducerCtor is a contructor function of a reducer which reduceAsync method will be executed.
     * param delayMilliseconds - milliseconds timeout before execute of reduceAsync method.
     * If execute method of ReducerTask is called within this timeout, then the timer is reset and new timeout is set
     * */
    createReducerTask: <T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null>(
      reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>,
      delayMilliseconds?: number): ReducerTask<T, A1, A2, A3, A4, A5, A6> => {

      return new ReducerTask(this.reduce.byConstructor.bind(this), reducerCtor, delayMilliseconds);
    },

  };

  /**
   * An object which contains operations to configure logging
  * */
  logging = {

    /**
     * Turns logging on.
     * The Store write message to browser console.
     * Logging is made according configuration. See setConfiguration method.
     * */
    turnOn: (): void => {
      logging.LogManager.isEnabled = true;
    },

    /**
     * Turns logging off that is no log message appears in browser console.
     * */
    turnOff: (): void => {
      logging.LogManager.isEnabled = false;
    },

    /**
     * Sets logging configuration.
     *
     * Configuration is store by two ways
     * 1. For all states - in case array of stateCtors is empty
     * 2. For particular combination of stateCtor and Log Event Type - if there are items in stateCtors array
     *
     * In case there are multiple items in  stateCtors array and there are multiple bits in eventType parameter,
     * then every pair of stateCtor and LogEventType bit will be configured with the given LogConfig.
     *
     * param stateCtors - an array of state constructor functions to apply.
     * param eventType - a bit mask of Log Event Types to apply.
     * param config - a Partial of LogConfig class to apply.
     * */
    setConfiguration: (
      stateCtors: IConstructor<any>[],
      eventType: LogEventType = AllLogEventTypes,
      config: Partial<LogConfig> = {}): void => {

      const newPairs = logging.getLogConfigPairs(eventType, config);
      if (stateCtors.length) {
        stateCtors.forEach(stateCtor => {
          const stateData = this.getStateData(stateCtor);
          stateData.logConfigPairs = logging.getUpdatedLogConfigPairs(stateData.logConfigPairs, newPairs);
        })
      } else {
        logging.LogManager.allStatesConfigPairs = logging.getUpdatedLogConfigPairs(logging.LogManager.allStatesConfigPairs, newPairs);
      }
    },

    /**
     * Removes all logging configuration. All combinations of stateCtor and LogEventType bit of all states are removed
     * as well as all combination for all stateCtors.
     * */
    resetConfiguration: (): void => {
      logging.LogManager.allStatesConfigPairs = [];
      const stateDataList = Array.from(this.store.values());
      for (let stateData of stateDataList) {
        stateData.logConfigPairs = [];
      }
    },

  };

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
    const reducer = this.config.resolver.get(reducerCtor);
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
        logger.log(LogEventType.ReduceByDelegateDeferred, stateData, { state: stateData.state });
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
        logger.log(LogEventType.ReducerByConstructorDeferred, stateData, { state: stateData.state, args });
      } else {
        logger.log(LogEventType.ReduceByConstructor, stateData, { state: stateData.state, args });
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
      deferredReducer.logger.log(
        LogEventType.ReducerRejected,
        stateData,
        { state: stateData.state, args: deferredReducer.args, reducerDelegate: deferredReducer.delegate })
      deferredReducer.reject(error);
    } else {
      deferredReducer.logger.log(
        LogEventType.ReducerResolved,
        stateData,
        { state: stateData.state, args: deferredReducer.args, reducerDelegate: deferredReducer.delegate })
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
    if (!this.config || !this.config.cloneMethodName)
      return state;

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

/**
 * The singletone instance of Storage.
 * */
export const Store: Storage = Storage.instance;
