import { IClone, IReducer, IDependecyResolver, IConstructor } from "./interfaces";
import { KeyValuePair, LogEventType, LogConfig } from "./classes";
import { IResolve, IReject } from "./private-interfaces";
import { Subscriber } from "rxjs";

export class StateData<T extends IClone<T>, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null> {
  state: T;
  subscribers: Array<Subscriber<T>> = [];
  isBusy: boolean = false;
  isStateInitiated: boolean = false;
  isStateSuspended: boolean = false;

  deferredGetters: Array<DeferredGetter<T>> = [];
  suspendedGetters: Array<DeferredGetter<T>> = []; // getters which came after state was suspended
  deferredReducers: Array<DeferredReducer<T, A1, A2, A3, A4, A5, A6>> = [];
  logConfigPairs: KeyValuePair<LogEventType, LogConfig>[] = [];
}

export class DeferredReducer<T extends IClone<T>, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null> {
  constructor(
    public reducer: IReducer<T, A1, A2, A3, A4, A5, A6>,
    public reducerArgs: any[],
    public resolve: IResolve<void>,
    public reject: IReject
  ) {
  }
}

export class DeferredGetter<T extends IClone<T>> {
  constructor(
    public resolve: (value?: T | PromiseLike<T>) => void,
  ) {
  }
}

export const SimpleDependecyResolver: IDependecyResolver = {
  get<T>(ctor: IConstructor<T>): T {
    return new ctor();
  }
};
