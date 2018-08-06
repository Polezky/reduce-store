import { Component, OnInit } from '@angular/core';
import { ReduceStore, SetStateReducer } from 'reduce-store';
import { LoginState, pendingLoginStateReducer, AuthStateLoginSubmittedReducer } from 'src/app/auth/states';
import { Authenticate } from 'src/app/auth/models/user';
import { AuthService } from 'src/app/auth/services/auth.service';
import { Router } from '@angular/router';

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
  pending$ = this.store.getObservableState(LoginState);
  error$ = this.store.getObservableState(LoginState);

  constructor(
    private store: ReduceStore,
    private authService: AuthService,
    private router: Router,
  ) { }

  ngOnInit() {}

  onSubmit(auth: Authenticate) {
    this.store.reduce(pendingLoginStateReducer);
    this.store.reduce(new AuthStateLoginSubmittedReducer(auth, this.authService, this.router));
  }
}
