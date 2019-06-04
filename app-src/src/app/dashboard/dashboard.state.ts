import { Injectable } from '@angular/core';
import { Clone, IReducer } from 'reduce-store';
import { Hero } from '@app/hero';
import { HeroService } from '@app/hero.service';

export class State extends Clone<State>{
  heroes: Hero[];
}

@Injectable({ providedIn: 'root' })
export class LoadReducer implements IReducer<State> {
  stateCtor = State;

  constructor(private heroService: HeroService) { }

  async reduceAsync(currentState: State = new State({ heroes: [] })): Promise<State> {
    const heroes = await this.heroService.getHeroes().toPromise();
    currentState.heroes = heroes.slice(1, 5);
    return currentState;
  }
}
