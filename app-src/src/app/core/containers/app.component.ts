import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ReduceStore } from 'reduce-store';
import { LayoutState, ToggleSidebarReducer } from 'src/app/core/containers/states';
import { map } from 'rxjs/operators';
import { AuthState, AuthStateLogoutReducer } from 'src/app/auth/states';
import { Router } from '@angular/router';

@Component({
  selector: 'bc-app',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <bc-layout>
      <bc-sidenav [open]="showSidenav$ | async">
        <bc-nav-item (navigate)="closeSidenav()" *ngIf="loggedIn$ | async" routerLink="/" icon="book" hint="View your book collection">
          My Collection
        </bc-nav-item>
        <bc-nav-item (navigate)="closeSidenav()" *ngIf="loggedIn$ | async" routerLink="/books/find" icon="search" hint="Find your next book!">
          Browse Books
        </bc-nav-item>
        <bc-nav-item (navigate)="closeSidenav()" *ngIf="!(loggedIn$ | async)">
          Sign In
        </bc-nav-item>
        <bc-nav-item (navigate)="logout()" *ngIf="loggedIn$ | async">
          Sign Out
        </bc-nav-item>
      </bc-sidenav>
      <bc-toolbar (openMenu)="openSidenav()">
        Book Collection
      </bc-toolbar>

      <router-outlet></router-outlet>
    </bc-layout>
  `,
})
export class AppComponent {
  showSidenav$: Observable<boolean>;
  loggedIn$: Observable<boolean>;

  constructor(
    private store: ReduceStore,
    private router: Router,
  ) {
    this.showSidenav$ = this.store.getObservableState(LayoutState).pipe(map(x => x.showSidenav));
    this.loggedIn$ = this.store.getObservableState(AuthState).pipe(map(x => x.loggedIn));
  }

  closeSidenav() {
    this.store.reduce(ToggleSidebarReducer);
  }

  openSidenav() {
    this.store.reduce(ToggleSidebarReducer);
  }

  logout() {
    this.closeSidenav();
    this.store.reduce(AuthStateLogoutReducer);
  }
}
