import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import { Authenticate, User } from '../models/user';

@Injectable()
export class AuthService {
  constructor() {}

  login({ username, password }: Authenticate): Observable<User> {
    if (username !== 'test') {
      return throwError('Invalid username or password');
    }

    return of({ name: 'User' });
  }

  logout() {
    return of(true);
  }
}
