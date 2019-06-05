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

  async reduceAsync(currentState: State): Promise<State> {
    const state = new State();
    state.heroes = await this.heroService.getHeroes().toPromise();
    return state;
  }
}

@Injectable({ providedIn: 'root' })
export class AddReducer implements IReducer<State> {
  stateCtor = State;

  constructor(private heroService: HeroService) { }

  async reduceAsync(currentState: State, name: string): Promise<State> {
    const hero = await this.heroService.addHero({ name } as Hero).toPromise();
    currentState.heroes.push(hero);
    return currentState;
  }
}

@Injectable({ providedIn: 'root' })
export class DeleteReducer implements IReducer<State> {
  stateCtor = State;

  constructor(private heroService: HeroService) { }

  async reduceAsync(currentState: State, hero: Hero): Promise<State> {
    currentState.heroes = currentState.heroes.filter(h => h.id != hero.id);
    await this.heroService.deleteHero(hero).toPromise();
    return currentState;
  }
}
