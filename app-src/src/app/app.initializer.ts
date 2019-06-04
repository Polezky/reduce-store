import { APP_INITIALIZER, Injector } from '@angular/core';
import { Store, StoreConfig, AllLogEventTypes, StoreService } from 'reduce-store';
import { environment } from '../environments/environment';

import * as messages from '@app/messages/messages.state';

export const AppInitializer = {
  provide: APP_INITIALIZER,
  useFactory: initializeFactory,
  deps: [Injector, StoreService],
  multi: true
}

export function initializeFactory(injector: Injector, store: StoreService) {
  return () => {
    Store.config.set({ cloneMethodName: 'clone' });
    Store.logging.setConfiguration([]);
    Store.logging.turnOn();

    if (!environment.production) {
      (<any>window).store = Store;
    }

    Store.reduce.byDelegateDeferred(messages.State, messages.initReducer);
  }
}
