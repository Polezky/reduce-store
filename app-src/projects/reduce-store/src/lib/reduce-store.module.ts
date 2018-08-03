import { NgModule, ModuleWithProviders, Optional, SkipSelf } from '@angular/core';
import { ReduceStore } from './reduce-store.service';

@NgModule({
  imports: [
  ],
  declarations: [],
  exports: []
})
export class ReduceStoreModule {
  constructor(@Optional() @SkipSelf() parentModule: ReduceStoreModule) {
    if (parentModule)
      throw new Error('ReduceStoreModule is already loaded. Import it in the AppModule only');
  }

  static forRoot(): ModuleWithProviders { 
    return {
      ngModule: ReduceStoreModule,
      providers: [
        ReduceStore
      ]
    }
  }
}
