import { Routes } from '@angular/router';
import { Clone, IReducerDelegate, IBrowserStorage } from 'reduce-store';

import { DashboardComponent } from './dashboard/dashboard.component';
import { HeroesComponent } from './heroes/heroes.component';
import { HeroDetailComponent } from './hero-detail/hero-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'detail/:id', component: HeroDetailComponent },
  { path: 'heroes', component: HeroesComponent }
];

export class State extends Clone<State> {
  url: string;
}

export const storageConfig: IBrowserStorage<State> = {
  key: 'Routes.State',
  stateCtor: State,
  deferredDelegate: setDefaultState()
};

function setDefaultState(): IReducerDelegate<State> {
  return (s = new State()): Promise<State> => {
    s.url = '/';
    return Promise.resolve(s);
  };
}

export function updateState(url: string): IReducerDelegate<State> {
  return (s = new State()): Promise<State> => {
    s.url = url;
    return Promise.resolve(s);
  };
}
