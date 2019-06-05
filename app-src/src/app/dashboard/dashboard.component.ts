import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from 'reduce-store';
import * as dashboard from '@app/dashboard/dashboard.state';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  state: dashboard.State;

  constructor() {
    Store.state.subscribe(dashboard.State, this, s => this.state = s);
  }

  ngOnInit() {
    Store.reduce.byConstructor(dashboard.LoadReducer);
  }

  ngOnDestroy(): void {
    Store.reduce.byDelegate(dashboard.State, s => Promise.resolve(undefined));
  }
}
