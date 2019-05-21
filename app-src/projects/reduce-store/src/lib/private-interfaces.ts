export interface IResolve<T> {
  (value?: T | PromiseLike<T>): void;
}

export interface IReject {
  (reason?: any): void;
}

export interface KeyValuePair<TKey, TValue> {
  key: TKey;
  value: TValue;
}
