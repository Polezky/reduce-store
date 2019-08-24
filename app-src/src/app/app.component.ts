import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import * as route from './routes';
import { Store } from 'reduce-store';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Tour of Heroes';

  constructor(
    private router: Router,
  ) {
    Store.state
      .get(route.State)
      .then(this.navigateByState.bind(this));
  }

  private async navigateByState(s: route.State): Promise<void> {
    await this.router.navigateByUrl(s.url);

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(this.updateRouteState.bind(this));
  }

  private updateRouteState(): void {
    const url = location.pathname;
    Store.reduce.byDelegate(route.State, route.updateState(url));
  }
}
