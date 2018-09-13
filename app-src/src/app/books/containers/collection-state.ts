import { Database } from '@ngrx/db';

import { CollectionState, IReducer, AsyncReducer } from 'reduce-store';
import { Book } from 'src/app/books/models/book';

export class BookCollectionState extends CollectionState<Book>{
  readonly itemsCtor = Book;
  loaded: boolean;
  loading: boolean;

  constructor(init: Partial<BookCollectionState>) {
    super(init);
  }

  static succes(items: Book[]): BookCollectionState {
    return new BookCollectionState({
      items: items,
      loaded: true,
      loading: false,
    });
  }

  static failed(): BookCollectionState {
    return new BookCollectionState({
      items: [],
      loaded: true,
      loading: false,
    });
  }
}

export class LoadingBookCollectionStateReducer extends AsyncReducer<BookCollectionState>{
  readonly stateCtor = BookCollectionState;

  reduce(state: BookCollectionState): BookCollectionState {
    state.loading = true;
    return state;
  }
}

export class LoadBookCollectionStateReducer implements IReducer<BookCollectionState>{
  readonly stateCtor = BookCollectionState;

  constructor(
    private db: Database,
  ) { }

  async reduceAsync(state: BookCollectionState): Promise<BookCollectionState> {
    return (this.db.query('books').toPromise() as Promise<Book[]>)
      .then(books => BookCollectionState.succes(books))
      .catch(e => BookCollectionState.failed());
  }
}

export class AddBookReducer implements IReducer<BookCollectionState>{
  readonly stateCtor = BookCollectionState;

  constructor(
    private db: Database,
  ) { }

  async reduceAsync(state: BookCollectionState, book: Book): Promise<BookCollectionState> {
    return (this.db.insert('books', [book]).toPromise() as Promise<Book[]>)
      .then(books => {
        state.items.push(book);
        return state;
      })
      .catch(e => state);
  }
}

export class RemoveBookReducer implements IReducer<BookCollectionState>{
  readonly stateCtor = BookCollectionState;

  constructor(
    private db: Database,
  ) { }

  async reduceAsync(state: BookCollectionState, book: Book): Promise<BookCollectionState> {
    return (this.db.insert('books', [book]).toPromise() as Promise<Book[]>)
      .then(books => {
        state.items.push(book);
        return state;
      })
      .catch(e => state);
  }
}

