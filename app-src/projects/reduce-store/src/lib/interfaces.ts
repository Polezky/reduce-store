/**
 * The constructor function interface
 * */
export interface IConstructor<T> {
  new(...args: any[]): T;
}

/**
 * The delegate function that changes a state
 * */
export interface IReducerDelegate<T> {
  (state: T) : Promise<T>;
}

/**
 * The interface for the Reducer. The Reducer changes state in its reduceAsync method
 * The Reducer references a state Constructor function in its readonly stateCtor property.
 * */
export interface IReducer<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null> {
  /**
   * a reference to a state constructor function
   * */
  readonly stateCtor: IConstructor<T>;

  /**
   * is used to change state from one to the other
   * */
  reduceAsync: (state: T, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6) => Promise<T>;
}

/**
 * The interface for a reducer's constructor. Is need for type check.
 * */
export interface IReducerConstructor<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null> {
  new(...args: any[]): IReducer<T, A1, A2, A3, A4, A5, A6>;
}

/**
 * The interface of resolving dependencies of Reducers
 * */
export interface IDependecyResolver {
  get<T>(ctor: IConstructor<T>): T;
}

export interface IFromBrowserStorageCtor<T> {
  new(init: Partial<T>): T;
}

