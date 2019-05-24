import { IReducerConstructor, IDependecyResolver } from "./interfaces";
import { DeferredTask, SimpleDependecyResolver } from "./private-classes";

var loggingDefaultPrefix = '';
var loggingDefaultCss = 'background-color: beige; color: green;';

export class StoreConfig {
  cloneMethodName?: string;
  disposeMethodName?: string = 'dispose';
  resolver: IDependecyResolver = SimpleDependecyResolver;

  constructor(init?: Partial<StoreConfig>) {
    Object.assign(this, init);
  }

  set(init: Partial<StoreConfig>): void {
    Object.assign(this, init);
  }
}

/**
 * The class which could be used to clone the object.
 * It is common that every state is immutable. The Store supports clonning the state in order to provide immutability.
 * If cloneMethodName is set in StoreConfig then all state getters and state subscribers receives their own copy of state
 * One can extend this class to implement simple clonning functionality.
 * */
export class Clone<T> {
  constructor(init?: Partial<T>) {
    Object.assign(this, init);
  }

  clone(): T {
    return new (<any>this.constructor)(this);
  }
}

export class ReducerTask<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null> {
  private deferredTask: DeferredTask<void, A1, A2, A3, A4, A5, A6>;

  constructor(
    private reduce: (reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6) => Promise<void>,
    private reducerCtor: IReducerConstructor<T, A1, A2, A3, A4, A5, A6>,
    private delayMilliseconds?: number,
  ) {
    this.deferredTask = this.createDeferredTask();
  }

  execute(a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<void> {
    return this.deferredTask.execute(a1, a2, a3, a4, a5, a6);
  }

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
};

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
  ReducerByConstructorDeferred = 1 << 8,
  ReduceByDelegateDeferred = 1 << 9,
  ReducerResolved = 1 << 10,
  ReducerRejected = 1 << 11,
}

/**
 * A bit mask which contains all bits of LogEventType
 * Is exported because it is common to log all Log Event Types.
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
  | LogEventType.ReducerByConstructorDeferred
  | LogEventType.ReduceByDelegateDeferred
  | LogEventType.ReducerResolved
  | LogEventType.ReducerRejected
  ;

/**
 * Configuration of logging to be applied for combination of stateCtor and Log Event Type bit
 *
 * prefix - optional string which will be written in console in the beginig of the message.
 * Could be used to distinguish messages of different Log Event Types and stateCtor.
 * default prefix is empty string
 *
 * level - the Log level to use
 *
 * css - css style which will be applied to prefix and Log Event Type name
 * default style is background-color: beige; color: green;
 * */
export class LogConfig {
  prefix?: string = loggingDefaultPrefix;
  level?: LogLevel = LogLevel.Log;
  css?: string = loggingDefaultCss;

  constructor(init?: Partial<LogConfig>) {
    Object.assign(this, init || {});
  }
}

