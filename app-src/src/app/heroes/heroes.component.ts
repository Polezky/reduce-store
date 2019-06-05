import { Component, OnInit, OnDestroy } from '@angular/core';

import { Hero } from '@app/hero';
import * as heroes from '@app/heroes/heroes.state';
import { Store } from 'reduce-store';

@Component({
  selector: 'app-heroes',
  templateUrl: './heroes.component.html',
  styleUrls: ['./heroes.component.css']
})
export class HeroesComponent implements OnInit, OnDestroy {
  state: heroes.State;

  constructor() {
    Store.state.subscribe(heroes.State, this, s => this.state = s);
  }

  ngOnInit() {
    Store.reduce.byConstructor(heroes.LoadReducer);
  }

  ngOnDestroy(): void {
    Store.reduce.byDelegate(heroes.State, s => Promise.resolve(undefined));
  }

  add(name: string): void {
    name = name.trim();
    if (!name) { return; }
    Store.reduce.byConstructor(heroes.AddReducer, name);
  }

  delete(hero: Hero): void {
    Store.reduce.byConstructor(heroes.DeleteReducer, hero);
  }

}
