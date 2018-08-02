import { NgModule, ModuleWithProviders, Optional, SkipSelf } from '@angular/core';
import { RStore } from './p-store.service';

@NgModule({
  imports: [
  ],
  declarations: [],
  exports: []
})
export class PStoreModule {
  constructor(@Optional() @SkipSelf() parentModule: PStoreModule) {
    if (parentModule)
      throw new Error('PStoreModule is already loaded. Import it in the AppModule only');
  }

  static forRoot(): ModuleWithProviders {
    return {
      ngModule: PStoreModule,
      providers: [
        RStore
      ]
    }
  }
}
