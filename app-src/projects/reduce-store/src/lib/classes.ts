import { IClone, IConstructor, IReducer, IStateGetter, ICollection, IReduce } from "./interfaces";

export class Clone<T> implements IClone<T> {
  constructor(init?: Partial<T>) {
    Object.assign(this, init);
  }

  clone(): T {
    return new (<any>this.constructor)(this);
  }
}

export class SetStateReducer<T extends IClone<T>> implements IReducer<T> {
  constructor(
    public stateCtor: IConstructor<T>,
    public reduceAsync: (state: T, stateGetter: IStateGetter<any>) => Promise<T>,
  ) { }

  static create<U extends IClone<U>>(stateCtor: IConstructor<U>, newState: U): IReducer<U> {
    const reduce = (state: U, stateGetter): Promise<U> => Promise.resolve(newState);
    return new SetStateReducer(stateCtor, reduce);
  }

  static createAsync<U extends IClone<U>>(stateCtor: IConstructor<U>, getter: () => Promise<U>): IReducer<U> {
    const reduce = (state: U, stateGetter): Promise<U> => getter();
    return new SetStateReducer(stateCtor, reduce);
  }
}

export abstract class AsyncReducer<T extends IClone<T>> implements IReducer<T> {
  abstract stateCtor: IConstructor<T>;

  abstract reduce(
    state: T,
    stateGetter: IStateGetter<any>,
    reduce: IReduce): T;

  reduceAsync(
    state: T,
    stateGetter: IStateGetter<any>,
    reduce: IReduce): Promise<T> {
    return Promise.resolve(this.reduce(state, stateGetter, reduce));
  }
}

export class ReducerTask<T extends IClone<T>> {
  deferredTask: DeferredTask<void>;

  constructor(
    private reduce: (reducer: IReducer<T>) => Promise<void>,
    private reducerCreator: (...argArray: any[]) => IReducer<T>,
    private delayMilliseconds?: number,
  ) {
    this.deferredTask = this.createDeferredTask();
  }

  execute(...argArray: any[]): Promise<void> {
    return this.deferredTask.execute(argArray);
  }

  private createDeferredTask(): DeferredTask<void> {
    return new DeferredTask(
      (...argArray: any[]) => {
        const reducer = this.reducerCreator(argArray);
        this.reduce(reducer);
      },
      null,
      this.delayMilliseconds);
  }
}

export class SetCollectionStateReducer<T1 extends ICollection<T2>, T2 extends IClone<T2>> implements IReducer<ICollection<T2>> {
  constructor(
    public stateCtor: IConstructor<ICollection<T2>>,
    public reduceAsync: (state: ICollection<T2>, stateGetter: IStateGetter<any>) => Promise<ICollection<T2>>,
  ) { }

  static create<U1 extends ICollection<U2>, U2 extends IClone<U2>>(
    stateCtor: IConstructor<ICollection<U2>>,
    getter: () => Promise<U2[]>,
    itemsCtor: IConstructor<U2>
  )
    : IReducer<ICollection<U2>> {

    const reduce = async (state: ICollection<U2>, stateGetter): Promise<ICollection<U2>> => {
      const items = await getter();
      return new stateCtor({ items, itemsCtor });
    };
    return new SetCollectionStateReducer(stateCtor, reduce);
  }
}

export class CollectionState<T extends IClone<T>> extends Clone<ICollection<T>> implements ICollection<T> {
  readonly itemsCtor: IConstructor<T>;

  items: T[];

  constructor(init: Partial<CollectionState<T>>) {
    super(init);
    this.items = init.items.map(x => new init.itemsCtor(x));
  }

  clone(): any {
    const cloneObj = super.clone();
    cloneObj.items = this.items.map(x => x.clone());
    return cloneObj;
  }

}

export class DeferredTask<TResult> {
  private cancelToken: any;

  constructor(
    private jobToDo: (...argArray: any[]) => TResult,
    private taskThisArg: any = null,
    private delayMilliseconds = 300,
  ) { }

  execute(...argArray: any[]): Promise<TResult> {
    clearTimeout(this.cancelToken);

    return new Promise<TResult>((resolve, reject) => {
      this.cancelToken = setTimeout(
        () => resolve(this.jobToDo.apply(this.taskThisArg, argArray)),
        this.delayMilliseconds);
    });
  }
}
