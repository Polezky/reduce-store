import { IReducerConstructor } from "./interfaces";

var loggingDefaultPrefix = '';
var loggingDefaultCss = 'background-color: beige; color: green;';

export class StoreConfig {
  cloneMethodName?: string;
  disposeMethodName?: string = 'dispose';

  constructor(init?: StoreConfig) {
    Object.assign(this, init);
  }
}

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

export class DeferredTask<TResult, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null> {
  private cancelToken: any;

  constructor(
    private jobToDo: (a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6) => TResult,
    private taskThisArg: any = null,
    private delayMilliseconds = 300,
  ) { }

  execute(a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<TResult> {
    clearTimeout(this.cancelToken);

    return new Promise<TResult>((resolve, reject) => {
      this.cancelToken = setTimeout(
        () => resolve(this.jobToDo.call(this.taskThisArg, a1, a2, a3, a4, a5, a6)),
        this.delayMilliseconds);
    });
  }
}

export enum LogLevel {
  Log = 1,
  Info = 2,
  Debug = 3,
  Warn = 4
};

export enum LogEventType {
  StateGetter = 1 << 0,
  StateGetterResolved = 1 << 1,
  SubscriberNotification = 1 << 2,
  SubscriberAdded = 1 << 3,
  SubscriberRemoved = 1 << 4,
  Reducer = 1 << 5,
  LazyReducer = 1 << 6,
  ReducerResolved = 1 << 7,
  ReducerRejected = 1 << 8,
  StateSuspended = 1 << 9,
}
export const AllLogEventTypes =
    LogEventType.StateGetter
  | LogEventType.StateGetterResolved
  | LogEventType.SubscriberNotification
  | LogEventType.SubscriberAdded
  | LogEventType.SubscriberRemoved
  | LogEventType.Reducer
  | LogEventType.LazyReducer
  | LogEventType.ReducerResolved
  | LogEventType.ReducerRejected
  | LogEventType.StateSuspended
  ;
export class LogConfig {
  prefix?: string = loggingDefaultPrefix;
  level?: LogLevel = LogLevel.Log;
  css?: string = loggingDefaultCss;

  constructor(init?: Partial<LogConfig>) {
    Object.assign(this, init || {});
  }
}

