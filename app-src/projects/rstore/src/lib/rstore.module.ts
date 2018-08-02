import { NgModule, ModuleWithProviders, Optional, SkipSelf } from '@angular/core';
import { RStore } from './rstore.service';

@NgModule({
  imports: [
  ],
  declarations: [],
  exports: []
})
export class RStoreModule {
  constructor(@Optional() @SkipSelf() parentModule: RStoreModule) {
    if (parentModule)
      throw new Error('RStoreModule is already loaded. Import it in the AppModule only');
  }

  static forRoot(): ModuleWithProviders {
    return {
      ngModule: RStoreModule,
      providers: [
        RStore
      ]
    }
  }
}
