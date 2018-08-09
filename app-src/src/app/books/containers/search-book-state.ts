import { map } from 'rxjs/operators';

import { Clone, IReducer } from "reduce-store";
import { Book } from "src/app/books/models/book";

import { GoogleBooksService } from "src/app/core/services/google-books.service";

export class SearchBookState extends Clone<SearchBookState>{
  books: Book[];
  loading: boolean;
  error: string;
  query: string;

  static empty() {
    return new SearchBookState({ books: [], loading: false, error: '', query: '' });
  }

  static success(query: string, books: Book[]) {
    return new SearchBookState({ books, query, loading: false, error: '' });
  }

  static error(query: string, error: string) {
    return new SearchBookState({ books: [], query, loading: false, error });
  }
}

export class StartSearchBookStateReducer implements IReducer<SearchBookState>{
  stateCtor = SearchBookState;

  constructor(
    private googleBooks: GoogleBooksService,
    private query: string,
  ) { }

  async reduceAsync(state: SearchBookState): Promise<SearchBookState> {
    if (!this.query || !this.query.length) return SearchBookState.empty();
    return this.googleBooks
      .searchBooks(this.query)
      .toPromise()
      .then(books => SearchBookState.success(this.query, books))
      .catch(error => SearchBookState.error(this.query, error));
  }
}

