import { NgModule, ModuleWithProviders, Optional, SkipSelf } from '@angular/core';
import { ReduceStore, StoreService } from './reduce-store.service';

/**
 * This angular module provides registration of the ReduceStore and StoreService services
 * See static ReduceStoreModule.forRoot method
 * */
@NgModule({
  imports: [
  ],
  declarations: [],
  exports: []
})
export class ReduceStoreModule {
  constructor(
    @Optional() @SkipSelf() parentModule: ReduceStoreModule,
  ) {
    if (parentModule)
      throw new Error('ReduceStoreModule is already loaded. Import it in the AppModule only');
  }

  /**
   * provides registration of the ReduceStore and StoreService services
   * Call it in an array of imports in main angualar application module (often app.module.ts)
   * e.g. imports: [ ... ReduceStoreModule.forRoot(), ... ]
   * */
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: ReduceStoreModule,
      providers: [
        ReduceStore,
        StoreService
      ]
    }
  }
}
