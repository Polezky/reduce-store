import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';

import { Book } from '../models/book';
import { ReduceStore, ReducerTask } from 'reduce-store';
import { SearchBookState, StartSearchBookStateReducer, } from 'src/app/books/containers/search-book-state';

@Component({
  selector: 'bc-find-book-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <bc-book-search [query]="searchQuery$ | async" [searching]="loading$ | async" [error]="error$ | async" (search)="search($event)"></bc-book-search>
    <bc-book-preview-list [books]="books$ | async"></bc-book-preview-list>
  `,
})
export class FindBookPageComponent {
  searchQuery$: Observable<string>;
  books$: Observable<Book[]>;
  loading$: Observable<boolean>;
  error$: Observable<string>;
  searchTask: ReducerTask<SearchBookState, string>;

  constructor(
    private store: ReduceStore,
  ) {
    this.searchQuery$ = this.store.getObservableState(SearchBookState).pipe(map(x => x.query), take(1));
    this.books$ = this.store.getObservableState(SearchBookState).pipe(map(x => x.books));
    this.loading$ = this.store.getObservableState(SearchBookState).pipe(map(x => x.loading));
    this.error$ = this.store.getObservableState(SearchBookState).pipe(map(x => x.error));
    this.searchTask = this.store.createReducerTask(StartSearchBookStateReducer);
  }

  search(query: string) {
    this.searchTask.execute(query);
  }
}
