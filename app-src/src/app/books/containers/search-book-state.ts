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
  ) { }

  async reduceAsync(state: SearchBookState, query: string): Promise<SearchBookState> {
    if (!query || !query.length) return SearchBookState.empty();
    return this.googleBooks
      .searchBooks(query)
      .toPromise()
      .then(books => SearchBookState.success(query, books))
      .catch(error => SearchBookState.error(query, error));
  }
}

