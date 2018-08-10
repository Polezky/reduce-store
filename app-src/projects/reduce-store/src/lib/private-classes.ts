import { IClone, IReducer } from "./interfaces";
import { IResolve, IReject } from "./private-interfaces";
import { Subscriber } from "rxjs";

export class StateData<T extends IClone<T>> {
  subscribers: Array<Subscriber<T>> = [];
  isBusy: boolean = false;

  deferredGetters: Array<DeferredGetter<T>> = [];
  deferredReducers: Array<DeferredReducer<T>> = [];

  constructor(
    public state?: T,
  ) { }
}

export class DeferredReducer<T extends IClone<T>> {
  constructor(
    public reducer: IReducer<T>,
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
