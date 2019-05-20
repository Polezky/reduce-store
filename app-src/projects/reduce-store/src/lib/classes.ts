import { IClone, IConstructor, IReducer, ICollection, IReducerConstructor } from "./interfaces";

var loggingDefaultPrefix = '';
var loggingDefaultCss = 'background-color: beige; color: green;';

export interface KeyValuePair<TKey, TValue> {
  key: TKey;
  value: TValue;
}

export class Clone<T> implements IClone<T> {
  constructor(init?: Partial<T>) {
    Object.assign(this, init);
  }

  clone(): T {
    return new (<any>this.constructor)(this);
  }
}

export abstract class CollectionState<T extends IClone<T>> extends Clone<ICollection<T>> implements ICollection<T> {
  abstract readonly itemsCtor: IConstructor<T>;

  items: T[];

  constructor(init: Partial<CollectionState<T>>) {
    super(init);
    this.items = init.items.map(x => new this.itemsCtor(x));
  }

  clone(): any {
    const cloneObj = super.clone();
    cloneObj.items = this.items.map(x => x.clone());
    return cloneObj;
  }

}

export abstract class AsyncReducer<T extends IClone<T>, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null> implements IReducer<T> {
  abstract readonly stateCtor: IConstructor<T>;

  abstract reduce(state: T, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): T;

  reduceAsync(state: T, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6): Promise<T> {
    return Promise.resolve(this.reduce(state, a1, a2, a3, a4, a5, a6));
  }
}

export class ReducerTask<T extends IClone<T>, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null> {
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

