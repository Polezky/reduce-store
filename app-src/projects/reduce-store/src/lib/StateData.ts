import { LogEventType, LogConfig } from "./classes";
import { StateSubscriber, DeferredGetter, DeferredReducer } from "./private-classes";
import { KeyValuePair } from "./private-interfaces";

export class StateData<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null> {
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
