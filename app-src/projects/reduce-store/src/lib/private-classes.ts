import { IReducer, IDependecyResolver, IConstructor, IReducerDelegate } from "./interfaces";
import { IResolve, IReject } from "./private-interfaces";
import { Subscriber } from "rxjs";
import * as logging from "./logging";

export class StateSubscriber<T> {
  constructor(
    public readonly subscriber: Subscriber<T>,
    public readonly logger: logging.Logger<T>,
  ) { }
}

export class DeferredReducer<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null> {
  readonly delegate?: IReducerDelegate<T>;
  readonly reducer?: IReducer<T, A1, A2, A3, A4, A5, A6>;
  readonly args?: any[];
  readonly resolve: IResolve<void>;
  readonly reject: IReject;
  readonly logger: logging.ReducerLogger<T>;

  constructor(init: Partial<DeferredReducer<T>>) {
    Object.assign(this, init);
  }
}

export class DeferredGetter<T>{
  constructor(
    public readonly resolve: (value?: T | PromiseLike<T>) => void,
    public readonly logger: logging.DurationLogger<T>,
  ) {
  }
}

export const SimpleDependecyResolver: IDependecyResolver = {
  get<T>(ctor: IConstructor<T>): T {
    return new ctor();
  }
};
