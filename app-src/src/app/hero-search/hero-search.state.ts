import { Injectable } from '@angular/core';
import { Clone, IReducer } from 'reduce-store';
import { Hero } from '@app/hero';
import { HeroService } from '@app/hero.service';

export class State extends Clone<State>{
  term: string;
  heroes: Hero[];
}

@Injectable({ providedIn: 'root' })
export class SearhReducer implements IReducer<State> {
  stateCtor = State;

  constructor(private heroService: HeroService) { }

  async reduceAsync(currentState: State = new State({ heroes: [] }), term: string): Promise<State> {
    if (currentState.term == term) return currentState;

    currentState.term = term;
    currentState.heroes = await this.heroService.searchHeroes(term).toPromise();
    return currentState;
  }
}
