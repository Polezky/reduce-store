import { Component, OnInit, OnDestroy } from '@angular/core';

import * as heroSearch from '@app/hero-search/hero-search.state';
import { Store, ReducerTask } from 'reduce-store';

@Component({
  selector: 'app-hero-search',
  templateUrl: './hero-search.component.html',
  styleUrls: ['./hero-search.component.css']
})
export class HeroSearchComponent implements OnDestroy {
  private searchTask: ReducerTask<heroSearch.State, string>;

  state: heroSearch.State;

  constructor() {
    this.searchTask = Store.reduce.createReducerTask(heroSearch.SearhReducer, 300);
    Store.state.subscribe(heroSearch.State, this, s => this.state = s);
  }

  search(term: string): void {
    this.searchTask.execute(term);
  }

  ngOnDestroy(): void {
    Store.reduce.byDelegate(heroSearch.State, s => Promise.resolve(undefined));
  }
}
