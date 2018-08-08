import { Database } from '@ngrx/db';

import { CollectionState, IReducer, AsyncReducer } from 'reduce-store';
import { Book } from 'src/app/books/models/book';

export class BookCollectionState extends CollectionState<Book>{
  loaded: boolean;
  loading: boolean;

  constructor(init: Partial<BookCollectionState>) {
    super(init);
  }

  static createSucces(items: Book[]): BookCollectionState {
    return new BookCollectionState({
      items: items,
      loaded: true,
      loading: false,
      itemsCtor: Book
    });
  }

  static createFailed(): BookCollectionState {
    return new BookCollectionState({
      items: [],
      loaded: true,
      loading: false,
      itemsCtor: Book
    });
  }
}

export class LoadingBookCollectionStateReducer extends AsyncReducer<BookCollectionState>{
  stateCtor = BookCollectionState;

  reduce(state: BookCollectionState): BookCollectionState {
    state.loading = true;
    return state;
  }
}

export class LoadBookCollectionStateReducer implements IReducer<BookCollectionState>{
  stateCtor = BookCollectionState;

  constructor(
    private db: Database,
  ) { }

  async reduceAsync(state: BookCollectionState): Promise<BookCollectionState> {
    return (this.db.query('books').toPromise() as Promise<Book[]>)
      .then(books => BookCollectionState.createSucces(books))
      .catch(e => BookCollectionState.createFailed());
  }
}

