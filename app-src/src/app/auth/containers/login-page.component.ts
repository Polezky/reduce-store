import { Component, OnInit } from '@angular/core';
import { ReduceStore } from 'reduce-store';
import { PendingLoginStateReducer, AuthStateLoginSubmittedReducer, AuthState } from 'src/app/auth/states';
import { Authenticate } from 'src/app/auth/models/user';
import { map } from 'rxjs/operators';

@Component({
  selector: 'bc-login-page',
  template: `
    <bc-login-form
      (submitted)="onSubmit($event)"
      [pending]="pending$ | async"
      [errorMessage]="error$ | async">
    </bc-login-form>
  `,
  styles: [],
})
export class LoginPageComponent implements OnInit {
  pending$ = this.store.getObservableState(AuthState).pipe(map(x => x.pending));
  error$ = this.store.getObservableState(AuthState).pipe(map(x => x.error));

  constructor(
    private store: ReduceStore,
  ) { }

  ngOnInit() {}

  onSubmit(auth: Authenticate) {
    this.store.reduce(PendingLoginStateReducer);
    this.store.reduce(AuthStateLoginSubmittedReducer, auth);
  }
}
