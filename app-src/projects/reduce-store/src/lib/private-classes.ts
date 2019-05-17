import { IClone, IReducer, IDependecyResolver, IConstructor } from "./interfaces";
import { KeyValuePair, LogEventType, LogConfig } from "./classes";
import { IResolve, IReject } from "./private-interfaces";
import { Subscriber } from "rxjs";

export class DurationContainer {
  private mainStartTime: number;
  private runStartTime: number;
  runDuration: number;

  constructor() {
    this.mainStartTime = performance.now();
  }

  get fullDuration(): number {
    return performance.now() - this.mainStartTime;
  }

  startRunTimer(): void {
    this.runStartTime = performance.now();
  }

  endRunTimer(): void {
    this.runDuration = performance.now() - this.runStartTime;
  }
}

export class LogData {
  eventType: LogEventType;
  stateCtor: IConstructor<any>;
  logError: Error;
  stateData: StateData<any>;
  state: any;
  durationFull?: number;
  durationRun?: number;
  args?: any[];
  stack: string[];

  constructor(init: Partial<LogData>) {
    Object.assign(this, init);
  }

  getLoggingData(): LogData {
    const clone = new LogData(this);
    delete clone.eventType;
    delete clone.logError;
    delete clone.stateData;
    return clone;
  }

  static createReducerResolved<T extends IClone<T>>(
    stateCtor: IConstructor<T>,
    deferredReducer: DeferredReducer<T>,
    stateData: StateData<T>): LogData {

    return new LogData({
      eventType: LogEventType.ReducerResolved,
      stateCtor,
      logError: deferredReducer.logError,
      stateData,
      state: stateData.state,
      durationFull: deferredReducer.fullDuration,
      durationRun: deferredReducer.runDuration,
      args: deferredReducer.reducerArgs
    });
  }
  
  static createStateGetterResolved<T extends IClone<T>>(
    stateCtor: IConstructor<T>,
    deferredGetter: DeferredGetter<T>,
    stateData: StateData<T>): LogData {

    return new LogData({
      eventType: LogEventType.StateGetterResolved,
      stateCtor,
      logError: deferredGetter.logError,
      stateData,
      state: stateData.state,
      durationFull: deferredGetter.fullDuration,
    });
  }

  static createReducer<T extends IClone<T>>(
    eventType: LogEventType,
    stateCtor: IConstructor<T>,
    stateData: StateData<T>,
    logError: Error,
    args: any[]
  ): LogData {

    return new LogData({
      eventType,
      stateCtor,
      logError,
      stateData,
      state: stateData.state,
      args
    });
  }

  static createStateSuspended<T extends IClone<T>>(
    stateCtor: IConstructor<T>,
    stateData: StateData<T>,
    logError: Error,
    durationContainer: DurationContainer
  ): LogData {

    return new LogData({
      eventType: LogEventType.StateSuspended,
      stateCtor,
      logError,
      stateData,
      state: stateData.state,
      durationFull: durationContainer.fullDuration
    });
  }

  static create<T extends IClone<T>>(
    eventType: LogEventType,
    stateCtor: IConstructor<T>,
    stateData: StateData<T>,
    logError: Error,
  ): LogData {

    return new LogData({
      eventType,
      stateCtor,
      stateData,
      state: stateData.state,
      logError,
    });
  }
}

export class StateSubscriber<T extends IClone<T>> {
  constructor(
    public readonly logError: Error,
    public readonly subscriber: Subscriber<T>,
  ) { }
}

export class StateData<T extends IClone<T>, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null> {
  state: T;
  subscribers: Array<StateSubscriber<T>> = [];
  isBusy: boolean = false;
  isStateInitiated: boolean = false;
  isStateSuspended: boolean = false;

  deferredGetters: Array<DeferredGetter<T>> = [];
  suspendedGetters: Array<DeferredGetter<T>> = []; // getters which came after state was suspended
  deferredReducers: Array<DeferredReducer<T, A1, A2, A3, A4, A5, A6>> = [];
  logConfigPairs: KeyValuePair<LogEventType, LogConfig>[] = [];
}

export class DeferredReducer<T extends IClone<T>, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null> extends DurationContainer {
  constructor(
    public readonly reducer: IReducer<T, A1, A2, A3, A4, A5, A6>,
    public readonly reducerArgs: any[],
    public readonly resolve: IResolve<void>,
    public readonly reject: IReject,
    public readonly logError: Error,
  ) {
    super();
  }
}

export class DeferredGetter<T extends IClone<T>> extends DurationContainer {
  constructor(
    public readonly resolve: (value?: T | PromiseLike<T>) => void,
    public readonly logError: Error,
  ) {
    super();
  }
}

export const SimpleDependecyResolver: IDependecyResolver = {
  get<T>(ctor: IConstructor<T>): T {
    return new ctor();
  }
};
