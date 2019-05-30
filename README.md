# reduce-store 

[![npm install][install-img]]([npm-url])
[![Downloads][downloads-img]]([stats-url])
![License]([license-img]])



This library contains functionality to store and reduce (change) multiple application states.

## The Concept.

At every moment an application can be described as a set of States.
User actions, server responses, and other events lead to reduce (change) of an application States.
Change of an application state is done by Reducers. A reducer is an object which implements the IReducer interface. 
A Reducer contains a reference to a State constructor function and reduceAsync method. This method receives a current state and up to 6 arguments and return a Promise of a next State. Reducers may have dependencies which are
resolved by an object which implements the IDependecyResolver interface.

Another way to change a State is to call anonymous reduce function (delegate), i.e. implements the IReducerDelegate interface.
That function receives a current State and returns a Promise of a next State.


An application usually has multiple States which are located in a different folder. The folder structure may follow the Domain Driven Design concept.
A State along with its Reducers may be located in the same file. It is recommended to create small states and simple reduce functions.
Because small functions are easy to test.

It is recommended that States be immutable. In that case, different application component receives different copies of a State.
These copies cannot influence each other and the State stored in the reduce-store Store.
Basic clone functionality can be found in the Clone class. One can extend this class and Store will support cloning of every state.
In order to turn cloning on a developer should call.

`Store.config.set({ cloneMethodName: 'clone' });`

## Author

Polezky Oleg
<br/>
[![Follow on GitHub][github-follow-img]][github-follow-url]
<br/>
[![Follow on Stack Overflow][stackoverflow-img]][stackoverflow-url]

## License

MIT License (Expat). See [LICENSE.md](LICENSE.md) for details.


## Code samples.


file: test.state.ts
```js
import { Clone, IReducer } from 'reduce-store';
import { Injectable } from '@angular/core';

export class State extends Clone<State> {
  value: number;
}

@Injectable({ providedIn: 'root' }) // here the Reducer is an angular service
export class TestStateReducer implements IReducer<State> {
  stateCtor = State;

  reduceAsync(state: State, newValue: number = new State()): Promise<State> {
    s.value = newValue;
    return Promise.resolve(s);
  };
}

export function TestStateDelegate(s: State = new State()): Promise<State> {
  return Promise.resolve(new State({ value: 1.75 }));
} 

```

file: test.component.ts

```js
import * as testState from './test.state.ts';
import { Component, OnDestroy } from '@angular/core';

@Component({ selector: 'test' })
export class TestComponent implements OnDestroy {
  private state: State;

  constructor(private store: StoreService) {
    this.store.state.subscribe(testState.State, this, this.onStateChanged);
  }

  ngOnDestroy(): void {}

  private onStateChanged(s: testState.State): void {
    this.state = s;
  }
}

```

file: app.component.ts

```js
import * as testState from './test.state.ts';
import { Component } from '@angular/core';

@Component({ template: '<test></test><input (click)="onButtonClick()" />' })
export class AppComponent {
  constructor(private store: StoreService) {
    this.store.reduce.byConstructor(testState.TestStateReducer, 1);
  }

  onButtonClick(): void {
    this.store.reduce.byDelegate(testState.State, testState.TestStateDelegate);
  }
}

```

[npm-url]: https://www.npmjs.com/package/reduce-store
[github-url]: https://github.com/Polezky/reduce-store
[readme-url]: https://github.com/Polezky/reduce-store#readme
[stats-url]: http://npm-stat.com/charts.html?package=reduce-store
[github-follow-url]: https://github.com/Polezky/reduce-store
[github-follow-img]: https://img.shields.io/github/followers/Polezky.svg?style=social&logo=github&label=Follow
[stackoverflow-img]: https://graph.facebook.com/947900031911518/picture?type=large
[stackoverflow-url]: https://stackoverflow.com/users/4934063/oleg-polezky

[install-img]: https://nodei.co/npm/reduce-store.png?compact=true
[downloads-img]: https://img.shields.io/npm/dt/reduce-store.svg
[license-img]: https://img.shields.io/npm/l/reduce-store.svg
[stats-url]: http://npm-stat.com/charts.html?package=reduce-store
