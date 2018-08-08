import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DBModule  } from '@ngrx/db';

import { ReduceStoreModule } from 'reduce-store';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from 'src/app/core/containers/app.component';
import { CoreModule } from 'src/app/core/core.module';
import { AuthModule } from 'src/app/auth/auth.module';
import { schema } from 'src/app/db';


@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AuthModule.forRoot(),

    ReduceStoreModule.forRoot(),

    AppRoutingModule,

    DBModule.provideDB(schema),

    CoreModule.forRoot(),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
