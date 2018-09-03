import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Book } from '../models/book';
import { ReduceStore } from 'reduce-store';
import { SelectedBookState } from 'src/app/books/containers/selected-book-state';
import { BookCollectionState, AddBookReducer } from 'src/app/books/containers/collection-state';
import { Database } from '@ngrx/db';

@Component({
  selector: 'bc-selected-book-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <bc-book-detail
      [book]="book$ | async"
      [inCollection]="isSelectedBookInCollection$ | async"
      (add)="addToCollection($event)"
      (remove)="removeFromCollection($event)">
    </bc-book-detail>
  `,
})
export class SelectedBookPageComponent {
  book$: Observable<Book>;
  isSelectedBookInCollection$: Observable<boolean>;

  constructor(
    private db: Database,
    private store: ReduceStore,
  ) {
    this.book$ = this.store.getObservableState(SelectedBookState).pipe(map(x => x.book));
    this.isSelectedBookInCollection$ = this.store.getObservableStateList(SelectedBookState, BookCollectionState).pipe(
      map(([selectedBook, collection]) => 
        !!selectedBook && collection.items.findIndex(x => x.id === selectedBook.book.id) > -1
      ));
  }

  addToCollection(book: Book) {
    this.store.reduce(new AddBookReducer(this.db, book));
  }

  removeFromCollection(book: Book) {
    this.store.dispatch(new CollectionActions.RemoveBook(book));
  }
}
