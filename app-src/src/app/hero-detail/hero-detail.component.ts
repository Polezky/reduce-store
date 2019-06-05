import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import * as heroDetail from '@app/hero-detail/hero-detail.state';
import { Store } from 'reduce-store';

@Component({
  selector: 'app-hero-detail',
  templateUrl: './hero-detail.component.html',
  styleUrls: ['./hero-detail.component.css']
})
export class HeroDetailComponent implements OnInit, OnDestroy {
  state: heroDetail.State;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private loadReducer: heroDetail.LoadReducer,
    private saveReducer: heroDetail.SaveReducer,
  ) {
    Store.state.subscribe(heroDetail.State, this, s => this.state = s);
  }

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id');
    Store.reduce.byDelegate(heroDetail.State, s => this.loadReducer.reduceAsync(s, id));
  }

  ngOnDestroy(): void {
    Store.reduce.byDelegate(heroDetail.State, heroDetail.clear);
  }

  goBack(): void {
    this.location.back();
  }

  async save(): Promise<void> {
    await Store.reduce.byDelegate(heroDetail.State, s => this.saveReducer.reduceAsync(s));
    this.goBack();
  }
}
