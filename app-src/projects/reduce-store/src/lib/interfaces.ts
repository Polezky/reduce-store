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
  (state: T): Promise<T>;
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

/**
 * The interface for states that is stored in the browser storage
 * A state of that kind must be able to construct itself from anonymous object that have properties of that state
 * */
export interface IFromBrowserStorageCtor<T> {
  new(init: Partial<T>): T;
}

/**
 * The interface for reducers that chage states that is stored in the browser storage
 * */
export interface IFromBrowserStorageReducer<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null> {
  readonly stateCtor: IFromBrowserStorageCtor<T>;

  reduceAsync: (state: T, a1?: A1, a2?: A2, a3?: A3, a4?: A4, a5?: A5, a6?: A6) => Promise<T>;
}

/**
 * The interface for a reducer constructor that chage states that is stored in the browser storage
 * */
export interface IFromBrowserStorageReducerConstructor<T, A1 = null, A2 = null, A3 = null, A4 = null, A5 = null, A6 = null> {
  new(...args: any[]): IFromBrowserStorageReducer<T, A1, A2, A3, A4, A5, A6>;
}

/**
 * The interface to configure required properties of browser storage functionality
 * */
export interface IBrowserStorageBase<T> {
  /**
   * The key to store the state value. A state must have its own unique key.
   * */
  key: string;

  /**
   * The constructor function of a state.
   * */
  stateCtor: IFromBrowserStorageCtor<T>;

  isEnabled?: boolean;
}

/**
 * The interface to configure browser storage functionality
 * */
export type IBrowserStorage<T> =
  IBrowserStorageBase<T> & { deferredDelegate: IReducerDelegate<T> }
  | IBrowserStorageBase<T> & { deferredReducerCtor: IFromBrowserStorageReducerConstructor<T> };


