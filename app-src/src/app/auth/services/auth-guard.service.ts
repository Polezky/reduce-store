import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { ReduceStore } from 'reduce-store';
import { AuthState } from 'src/app/auth/states';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private store: ReduceStore) { }

  canActivate(): Observable<boolean> {
    return this.store.getObservableState(AuthState).pipe(map(x => x.loggedIn));
  }
}
