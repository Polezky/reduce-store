import { APP_INITIALIZER, Injector, Injectable } from '@angular/core';
import { Store, AllLogEventTypes, StoreService } from 'reduce-store';
import { environment } from '../environments/environment';

import * as messages from '@app/messages/messages.state';
import * as route from './routes';

[Injectable({ providedIn: 'root' })]
export class NgStoreService extends StoreService {
  constructor(injector: Injector) {
    super(injector);
  }
}

export const AppInitializer = {
  provide: APP_INITIALIZER,
  useFactory: initializeFactory,
  deps: [Injector],
  multi: true
}

export function initializeFactory(injector: Injector) {
  return () => {
    Store.config.set({
      resolver: injector,
      cloneMethodName: 'clone',
      disposeMethodName: 'ngOnDestroy'
    });

    Store.browserStorage.configure(route.storageConfig);

    //Store.logging.setConfiguration([]);
    Store.logging.setConfiguration([route.State], AllLogEventTypes, { css: 'color: red;' });

    Store.logging.turnOn();

    if (!environment.production) {
      (<any>window).store = Store;
    }

    Store.reduce.byDelegateDeferred(messages.State, messages.initReducer);
  }
}
