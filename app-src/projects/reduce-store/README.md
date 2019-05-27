reduce-store is library which contains the functionality to store and reduce (change) multiple application states.

The source code can be found https://github.com/Polezky/reduce-store

The Concept.
At every moment an application can be described as a set of States.
User actions, server messages and other events lead to reduce (change) of an application States.
Change of an application state is done by Reducers. Reducer is an object which implements IReducer interface. 
A Reducer contain a reference to a State constructor function and reduceAsync method. This method receives 
a current state and up to 6 arguments and return a Promise of a next State. Reducers may have dependecies which are
resolved by object which implements IDependecyResolver interface.
Another way to change a State is to call anonymouse reduce function (delegate), i.e. implements IReducerDelegate interface.
That function receives a current State and return a Promise of a next State.

Application ussually have multiple States which are located in different folder. The folder structure may follow Domain Driven Design concept.
A State along with Reducers for this State may be located in the same file. It is recommended to create small states and simple reduce functions.
Because small functions are easy to test.

It is recommended that States to be immutable that is different application component receives different copies of a State.
These copies cannot infulence each other and the State stored in the reduce-store Store.
Basic clone functionality can be found in Clone class. One can extend this class and Store will support cloning every state.
In order to turn cloning on a developer should call store.config.set({ cloneMethodName: 'clone' });

Author is Polezky Oleg.

Code samples.

/// file: 'test.state.ts'

class State extends Clone<State> {
  value: number;
}

@Injectable({ providedIn: 'root' }) // here the Reducer is an angular service
class TestStateReducer implements IReducer<State>{
  stateCtor = State;

  reduceAsync(state: State, newValue: number = new State()): Promise<State> {
    s.value = newValue;
    return Promise.resolve(s);
  };
}

export function TestStateDelegate(s: State = new State()): Promise<State> {
  return Promise.resolve(new State({ value: 1.75 }));
} 

/// file: 'test.component.ts'
import * as testState from './test.state.ts';

@Component({ selector: 'test' })
class TestComponent implements OnDestroy {
  private state: State;

  constructor(private store: StoreService) {
    this.store.state.subscribe(testState.State, this, this.onStateChanged);
  }

  ngOnDestroy(): void {
  }

  private onStateChanged(s: testState.State): void {
    this.state = s;
  }
}

/// file: 'app.component.ts'
import * as testState from './test.state.ts';

@Component({ template: '<test></test><input (click)="onButtonClick()" />' })
class AppComponent {
  constructor(private store: StoreService) {
    this.store.reduce.byConstructor(testState.TestStateReducer, 1);
  }

  onButtonClick(): void {
    this.store.reduce.byDelegate(testState.State, testState.TestStateDelegate);
  }
}
