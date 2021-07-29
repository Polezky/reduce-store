import { IReducerConstructor, IDependecyResolver, IStateConstructor, IReducerDelegate, IFromBrowserStorageReducerConstructor, IBrowserStorage, IReducer, IFromBrowserStorageCtor } from './interfaces';
import { DeferredTask, SimpleDependecyResolver } from './private-classes';
import { stringify, parse } from 'flatted/esm';

const loggingDefaultPrefix = '';
const loggingDefaultCss = 'background-color: beige; color: green;';

/**
 * The class which contains configurations for the Store
 * */
export class StoreConfig {
  /**
   * The name of the method which is used by the Store to provide immutability of states.
   * When states are immutable it means that every state getter and subscriber gets its own clone of state.
   * States must provide clone funtionality in a method with this name. Before the Store passes state to a getter or
   * a subscriber it executes state method with this name to make a clone.
   * If this property set to Falsy (e.g. undefined), then states are mutable.
   * */
  cloneMethodName?: string;

  /**
   * The component which is passed to Store.state.subscribe method must have a method with this name.
   * If the component doesn't have such a methdod then an exception will be throwen.
   * This method will be wrapped by the Store and when the component dispose method is called
   * then Store unsubscribes the subscription and calls original dispose method.
   * */
  disposeMethodName?: string;

  /**
   * This class is used to create instances of Reducers. Reducers are created in Store.reduce.byConstructor and
   * Store.reduce.byConstructorDeferred methods
   * */
  resolver: IDependecyResolver = SimpleDependecyResolver;

  /**
   * @param init - partial of StoreConfig.
   */
  constructor(init?: Partial<StoreConfig>) {
    Object.assign(this, init);
  }

  /**
   *
   * @param init - a partial of StoreConfig. Properties which is set in the partial is the only which is changed it the Store config.
   * if your partial has cloneMethodName only it means that cloneMethodName is changed and other config properties remains the same.
   */
  set(init: Partial<StoreConfig>): void {
    Object.assign(this, init);
  }
}

/**
 * The class which could be used to clone the object.
 * It is common that every state is immutable. The Store supports clonning the state in order to provide immutability.
 * If cloneMethodName is set in StoreConfig then all state getters and state subscribers receive their own copy of state
 * One can extend this class to implement simple clonning functionality.
 * */
export class Clone<T> {

  /**
   * Constructor which accepts partial of itself. This conctructor copies all passed properties to a newly created object
   * @param init - partial for newly created object.
   */
  constructor(init?: Partial<T>) {
    Object.assign(this, init);
  }

  /**
   * Provides basic functionality to clone the object. This methods call the constructor with 'this' as the only argument
   * */
  clone(): T {
    return new (this.constructor as any)(this);
  }
}

/**
 * Instances of this class is used by Store.reduce.createReducerTask method
 * This task executes the given reducer's reduceAsync methods in the given amout of delay milliseconds
 * This is useful when there is a need to execute one action as a reaction to multiple single-type actions.
 * This task could be used in case there is a need to call server as a reaction for user typing. So one call of
 * server will be executed if user press key multiple time within 300 milliseconds.
 * The example of usage:
 * 1. Implement a reducer which implements IReducer<T> interface
 * 2. Create an instance of the reducer task by calling Store.reduce.createReducerTask
 *    e.g. task = Store.reduce.createReducerTask(Reducer, delay)
 * 3. subscribe to multiple single-type actions
 *    e.g. window.onresize(task.execute)
 * */
export class ReducerTask<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null> {
  private deferredTask: DeferredTask<void, A1, A2, A3, A4, A5, A6>;

  /**
   * @param reduce - the method which is used when time to execute a job comes
   * the Store pass Store.reduce.byConstructor method to this argument
   * @param reducerCtor is a contructor function of a reducer which reduceAsync method will be executed.
   * @param delayMilliseconds - milliseconds timeout before execute of reduceAsync method.
   * If execute method of ReducerTask is called within this timeout, then the timer is reset and new timeout is set
   */
  constructor(
    private reduce: (reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6) => Promise<void>,
    private reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>,
    private delayMilliseconds?: number,
  ) {
    this.deferredTask = this.createDeferredTask();
  }

  /**
   * Start new waiting timeout before a call of reducer's reduceAsync method
   * Call this methods when a single-type action happens. E.g. window.onresize or input.onkeydown
   * @param a1 - an argument matches the second reduceAsync method argument of the Reducer, because the first argument is a state
   * @param a2 - an argument matches the third reduceAsync method argument of the Reducer
   * @param a3 - an argument matches the fourth reduceAsync method argument of the Reducer
   * @param a4 - an argument matches the fifth reduceAsync method argument of the Reducer
   * @param a5 - an argument matches the sixth reduceAsync method argument of the Reducer
   * @param a6 - an argument matches the seventh reduceAsync method argument of the Reducer
   */
  execute(a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<void> {
    return this.deferredTask.execute(a1, a2, a3, a4, a5, a6);
  }

  /**
   * Do not use this method. It is needed for typescript compile check
   * */
  typescriptCheck(): T {
    throw Error('Do not use. It is needed for typescript compile check');
  }

  private createDeferredTask(): DeferredTask<void, A1, A2, A3, A4, A5, A6> {
    return new DeferredTask(
      (a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6) => {
        this.reduce(this.reducerCtor, a1, a2, a3, a4, a5, a6);
      },
      null,
      this.delayMilliseconds);
  }
}

/**
 * The level of logging. Correspongin methods of console object will be used for logging.
 * That is for Debug level will be used console.debug method, for Warn will be used console.warn method.
 * */
export enum LogLevel {
  Log = 1,
  Info = 2,
  Debug = 3,
  Warn = 4
}

/**
 * StateGetter                  when state.get method is executed
 * StateGetterResolved          when the promise returned by state.get method is resolved
 * SubscriberNotification       when subscriber of the observable received from state.getObservable method is notified
 * SubscriberAdded              when state.getObservable method is executed
 * SubscriberRemoved            when subscriber of the observable received from state.getObservable method or from state.subscribe is completed and deleted
 * StateSuspended               when the promise returned by state.suspend method is resolved
 * ReduceByConstructor          when reducer.byConstructor method is executed
 * ReduceByDelegate             when reducer.ReduceByDelegate method is executed
 * ReducerByConstructorDeferred when reducer.ReducerByConstructorDeferred method is executed
 * ReduceByDelegateDeferred     when reducer.ReduceByDelegateDeferred method is executed
 * ReducerResolved              when the promise of reducer is resolved
 * ReducerRejected              when the promise of reducer is rejected
 *
 * */
export enum LogEventType {
  StateGetter = 1 << 0,
  StateGetterResolved = 1 << 1,
  SubscriberAdded = 1 << 2,
  SubscriberNotification = 1 << 3,
  SubscriberRemoved = 1 << 4,
  StateSuspended = 1 << 5,
  ReduceByConstructor = 1 << 6,
  ReduceByDelegate = 1 << 7,
  ReduceByConstructorDeferred = 1 << 8,
  ReduceByDelegateDeferred = 1 << 9,
  ReducerResolved = 1 << 10,
  ReducerRejected = 1 << 11,
}

/**
 * A bit mask that contains all bits of LogEventType
 * It is exported because it is common to log all Log Event Types.
 * */
export const AllLogEventTypes =
  LogEventType.StateGetter
  | LogEventType.StateGetterResolved
  | LogEventType.SubscriberAdded
  | LogEventType.SubscriberNotification
  | LogEventType.SubscriberRemoved
  | LogEventType.StateSuspended
  | LogEventType.ReduceByConstructor
  | LogEventType.ReduceByDelegate
  | LogEventType.ReduceByConstructorDeferred
  | LogEventType.ReduceByDelegateDeferred
  | LogEventType.ReducerResolved
  | LogEventType.ReducerRejected
  ;

/**
 * Configuration of logging to be applied for a combination of a stateCtor and a Log Event Type bit
 * */
export class LogConfig {
  /**
   * optional string which will be written in console in the beginig of the message.
   * */
  prefix?: string = loggingDefaultPrefix;

  /**
   * optional the Log level to use.
   * */
  level?: LogLevel = LogLevel.Log;

  /**
   * optional css style which will be applied to prefix and Log Event Type name
   * default style is background-color: beige; color: green;
   * */
  css?: string = loggingDefaultCss;

  /**
   * @param init - optional partial of LogConfig
   */
  constructor(init?: Partial<LogConfig>) {
    Object.assign(this, init || {});
  }
}

/**
* This calss implements functionality to store a state in the browser storage.
* */
export class BrowserStorage<T> {
  /**
   * The key to store the state value. A state must have its own unique key.
   * */
  readonly key: string;

  /**
   * The constructor function of a state.
   * */
  readonly stateCtor: IFromBrowserStorageCtor<T>;

  /**
   * The delegate that will be used to create a new state if it is not exist in the browser storage
   * State creation will be deferred until. state is asked
   * */
  readonly deferredDelegate?: IReducerDelegate<T>;

  /**
   * The reducer constructor that will be used to create a new state if it is not exist in the browser storage
   * State creation will be deferred until. state is asked
   * */
  readonly deferredReducerCtor?: IFromBrowserStorageReducerConstructor<T>;

  /**
   * The type of the browser storage: session or local.
   * Optional, default type is localStorage.
   * */
  readonly type?: 'sessionStorage' | 'localStorage' = 'localStorage';

  /**
   * The date when the state value stored in the browser storage is expired.
   * If this date is undefined then the state value will never expire.
   * */
  readonly expirationDate?: Date;

  /**
   * If this property is true, then the state is saved to the browser storage every time a reducer is applied
   * If this property is true and the state has not been intitiate, then either deferredDelegate or deferredReducerCtor
   * will be applied to create the state. State creation will be deferred until. state is asked.
   * If this property is false, then the browser storage functionality is not used.
   * */
  isEnabled = true;

  constructor(init: IBrowserStorage<T>) {
    Object.assign(this, init);
  }

  get storage(): Storage {
    return window[this.type];
  }

  saveState(state: T): void {
    if (!this.isEnabled) { return; }

    this.storage.setItem(this.key, stringify(state));
  }

  getState(): T {
    if (!this.isEnabled) { throw new Error('Browser storage is not enabled'); }

    const statePartial = parse(this.storage.getItem(this.key));
    return this.createState(statePartial);
  }

  createState(statePartial: Partial<T>): T {
    return new this.stateCtor(statePartial);
  }

  hasState(): boolean {
    if (!this.isEnabled) { return false; }

    const isExpired = this.expirationDate && this.expirationDate.getTime() < new Date().getTime();

    if (isExpired) {
      return false;
    }

    const item = this.storage.getItem(this.key);
    return item !== null;
  }
}
