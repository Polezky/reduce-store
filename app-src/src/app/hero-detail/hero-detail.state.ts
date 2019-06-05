import { Injectable } from '@angular/core';
import { Clone, IReducer } from 'reduce-store';
import { Hero } from '@app/hero';
import { HeroService } from '@app/hero.service';

export class State extends Clone<State>{
  hero: Hero;
}

@Injectable({ providedIn: 'root' })
export class LoadReducer implements IReducer<State> {
  stateCtor = State;

  constructor(private heroService: HeroService) { }

  async reduceAsync(currentState: State, id: number): Promise<State> {
    const state = new State();
    state.hero = await this.heroService.getHero(id).toPromise();
    return state;
  }
}

@Injectable({ providedIn: 'root' })
export class SaveReducer implements IReducer<State> {
  stateCtor = State;

  constructor(private heroService: HeroService) { }

  async reduceAsync(currentState: State): Promise<State> {
    await this.heroService.updateHero(currentState.hero).toPromise();
    return currentState;
  }
}

export function clear(): Promise<State> {
  return Promise.resolve(undefined);
}
