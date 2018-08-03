export interface IResolve<T> {
  (value?: T | PromiseLike<T>): void;
}

export interface IReject {
  (reason?: any): void;
}
