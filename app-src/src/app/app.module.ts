import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { ReduceStoreModule } from 'reduce-store';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from 'src/app/core/containers/app.component';
import { CoreModule } from 'src/app/core/core.module';


@NgModule({
  declarations: [
  ],
  imports: [
    BrowserModule,
    ReduceStoreModule.forRoot(),

    AppRoutingModule,
    CoreModule.forRoot(),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
