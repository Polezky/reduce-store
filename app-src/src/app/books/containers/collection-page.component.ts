import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Database } from '@ngrx/db';

import { Book } from '../models/book';
import { ReduceStore } from 'reduce-store';
import { BookCollectionState, LoadingBookCollectionStateReducer, LoadBookCollectionStateReducer } from 'src/app/books/containers/collection-state';

@Component({
  selector: 'bc-collection-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card>
      <mat-card-title>My Collection</mat-card-title>
    </mat-card>

    <bc-book-preview-list [books]="books$ | async"></bc-book-preview-list>
  `,
  styles: [
    `
      mat-card-title {
        display: flex;
        justify-content: center;
      }
    `,
  ],
})
export class CollectionPageComponent implements OnInit {
  books$: Observable<Book[]>;

  constructor(
    private store: ReduceStore,
    private db: Database,
  ) {
    this.books$ = this.store.getObservableState(BookCollectionState).pipe(map(x => x.items || []));
  }

  ngOnInit() {
    this.store.reduce(LoadingBookCollectionStateReducer);
    this.store.reduce(LoadBookCollectionStateReducer);
  }
}
