import { IClone, IReducer, IDependecyResolver, IConstructor } from "./interfaces";
import { KeyValuePair, LogEventType, LogConfig } from "./classes";
import { IResolve, IReject } from "./private-interfaces";
import { Subscriber } from "rxjs";

export class DurationContainer {
  private startTime: number;

  constructor() {
    this.start();
  }

  get duration(): number {
    return performance.now() - this.startTime;
  }

  private start(): void {
    this.startTime = performance.now();
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
