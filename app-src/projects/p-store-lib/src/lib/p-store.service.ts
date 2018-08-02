import { Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs';
import { finalize, reduce } from 'rxjs/operators';
import { StateData, DeferredGetter, DeferredReducer } from './private-classes';
import { IClone, IConstructor, ICollection, IReducer } from './interfaces';

@Injectable({
  providedIn: 'root'
})
export class RStore {
  private store = new Map<IConstructor<IClone<any>>, StateData<any>>();

  async getCollectionState<T extends IClone<T>>(stateCtor: IConstructor<ICollection<T>>): Promise<T[]> {
    return this.getState(stateCtor).then(x => x.items);
  }

  async getState<T extends IClone<T>>(stateCtor: IConstructor<T>): Promise<T> {
    const stateData = this.getStateData(stateCtor);
    return new Promise<T>((resolve, reject) => {
      const deferred = new DeferredGetter(resolve);
      stateData.deferredGetters.push(deferred);
      this.reduceDeferred(stateCtor);
      if (!stateData.isBusy) this.resolveDefferedGetters(stateCtor);
    });
  }

  getObservableState<T extends IClone<T>>(stateCtor: IConstructor<T>): Observable<T> {
    const stateData = this.getStateData(stateCtor);
    const subject = new Subject<T>();
    stateData.subjects.push(subject);
    this.getState(stateCtor).then(value => subject.next(this.safeClone(value)));

    return subject
      .asObservable()
      .pipe(finalize(() => {
        const stateData = this.store.get(stateCtor);
        const index = stateData.subjects.findIndex(x => x === subject);
        stateData.subjects.splice(index, 1);
      }));
  }

  async lazyReduce<T extends IClone<T>>(reducer: IReducer<T>): Promise<void> {
    return this.inernalReduce(reducer, true);
  }

  async reduce<T extends IClone<T>>(reducer: IReducer<T>): Promise<void> {
    return this.inernalReduce(reducer, false);
  }

  private async inernalReduce<T extends IClone<T>>(reducer: IReducer<T>, isDeferred: boolean = false): Promise<void> {
    const stateData = this.getStateData(reducer.stateCtor);
    return new Promise<void>((resolve, reject) => {
      const deferred = new DeferredReducer(reducer, resolve, reject);
      stateData.deferredReducers.push(deferred);
      if (isDeferred) return;
      this.reduceDeferred(reducer.stateCtor);
    });
  }

  private async notifySubscribers<T extends IClone<T>>(stateData: StateData<T>): Promise<void> {
    if (!stateData.subjects.length) return;
    const value = stateData.state;
    for (let subject of stateData.subjects) {
      const cloneValue = this.safeClone(value);
      subject.next(cloneValue);
    }
  }

  private getStateData<T extends IClone<T>>(stateCtor: IConstructor<T>): StateData<T> {
    let stateData = this.store.get(stateCtor) as StateData<T>;
    if (stateData) return stateData;

    stateData = new StateData();
    this.store.set(stateCtor, stateData);
    return stateData;
  }

  private async reduceDeferred<T extends IClone<T>>(stateCtor: IConstructor<T>): Promise<void> {
    const stateData = this.getStateData(stateCtor);
    if (stateData.isBusy) return;

    const deferredReducer = stateData.deferredReducers.shift();
    if (!deferredReducer) return;

    stateData.isBusy = true;

    const newState = await (deferredReducer.reducer
      .reduce(stateData.state, this.getState.bind(this))
      .catch(e => {
        deferredReducer.reject();
        return stateData.state;
      })
    );

    stateData.state = this.safeClone(newState);
    deferredReducer.resolve();

    if (stateData.deferredReducers.length) {
      this.reduceDeferred(stateCtor);
      return;
    }

    this.resolveDefferedGetters(stateCtor);

    await this.notifySubscribers(stateData);

    stateData.isBusy = false;
  }

  private resolveDefferedGetters<T extends IClone<T>>(stateCtor: IConstructor<T>): void {
    const stateData = this.getStateData(stateCtor);
    stateData.deferredGetters.forEach(g => {
      const cloneState = this.safeClone(stateData.state);
      g.resolve(cloneState);
    });
    stateData.deferredGetters = [];
  }

  private safeClone(state: IClone<any> | undefined): any {
    if (state === undefined) return undefined;
    return state.clone();
  }
}
