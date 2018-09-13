import { IClone, IReducer } from "./interfaces";
import { IResolve, IReject } from "./private-interfaces";
import { Subscriber } from "rxjs";

export class StateData<T extends IClone<T>, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null> {
  subscribers: Array<Subscriber<T>> = [];
  isBusy: boolean = false;

  deferredGetters: Array<DeferredGetter<T>> = [];
  deferredReducers: Array<DeferredReducer<T, A1, A2, A3, A4, A5, A6>> = [];

  constructor(
    public state?: T,
  ) { }
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
