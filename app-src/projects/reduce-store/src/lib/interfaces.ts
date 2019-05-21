export interface IConstructor<T> {
  new(...args: any[]): T;
}

export interface IReducerDelegate<T> {
  (state: T) : Promise<T>;
}

export interface IReducer<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null> {
  readonly stateCtor: IConstructor<T>;
  reduceAsync: (state: T, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6) => Promise<T>;
}

export interface IReducerConstructor<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null> {
  new(...args: any[]): IReducer<T, A1, A2, A3, A4, A5, A6>;
}

export interface IDependecyResolver {
  get<T>(ctor: IConstructor<T>): T;
}
