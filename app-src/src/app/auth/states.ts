import { Clone, IReducer, SetStateReducer, IReduce, AsyncReducer } from "reduce-store";
import { User, Authenticate } from "src/app/auth/models/user";
import { AuthService } from "src/app/auth/services/auth.service";
import { Router } from "@angular/router";

export class AuthState extends Clone<AuthState>{
  loggedIn: boolean;
  user: User | null;
  error: string | null;
  pending: boolean;
}

export class AuthStateLoginSubmittedReducer implements IReducer<AuthState> {
  readonly stateCtor = AuthState;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) { }

  reduceAsync(state: AuthState, auth: Authenticate): Promise<AuthState> {
    return this.authService.login(auth)
      .toPromise()
      .then(user => {
        this.router.navigate(['/']);
        return new AuthState({ loggedIn: true, user, error: null, pending: false  });
      })
      .catch(error => {
        return new AuthState({ loggedIn: false, user: null, error, pending: false  });
      });
  }
}

export class AuthStateLogoutReducer extends AsyncReducer<AuthState>{
  readonly stateCtor = AuthState;

  constructor(
    private router: Router,
  ) {
    super();
  }

  reduce(state: AuthState): AuthState {
    this.router.navigate(['/login']);
    return new AuthState({ loggedIn: false, user: null });
  }
}

export class PendingLoginStateReducer extends AsyncReducer<AuthState>{
  readonly stateCtor = AuthState;
  reduce(state: AuthState): AuthState { return new AuthState({ error: null, pending: true }); }
}
