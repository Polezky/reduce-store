import { Clone, IReducer, SetStateReducer, IReduce } from "reduce-store";
import { User, Authenticate } from "src/app/auth/models/user";
import { AuthService } from "src/app/auth/services/auth.service";

export class AuthState extends Clone<AuthState>{
  loggedIn: boolean;
  user: User | null;
}

export class LoginState extends Clone<LoginState>{
  error: string | null;
  pending: boolean;
}

export class AuthStateLoginSubmittedReducer implements IReducer<AuthState> {
  stateCtor = AuthState;

  constructor(
    private auth: Authenticate,
    private authService: AuthService,
  ) { }

  async reduceAsync(state: AuthState, stateGetter, reduce: IReduce): Promise<AuthState> {
    return this.authService.login(this.auth)
      .toPromise()
      .then(user => {
        reduce(successLoginStateReducer);
        return new AuthState({ loggedIn: true, user });
      })
      .catch(error => {
        reduce(getErrorLoginStateReducer(error));
        return new AuthState({ loggedIn: false, user: null });
      });
  }
}

export const pendingLoginStateReducer = SetStateReducer.create(LoginState, new LoginState({ error: null, pending: true }));

const getErrorLoginStateReducer = (error) => SetStateReducer.create(LoginState, new LoginState({ error, pending: false }));

const successLoginStateReducer = SetStateReducer.create(LoginState, new LoginState({ error: null, pending: false }));
