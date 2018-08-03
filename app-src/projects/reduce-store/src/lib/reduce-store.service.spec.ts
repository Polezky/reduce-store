import { TestBed, inject } from '@angular/core/testing';

import { ReduceStore } from './reduce-store.service';

describe('ReduceStore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReduceStore]
    });
  });

  it('should be created', inject([ReduceStore], (service: ReduceStore) => {
    expect(service).toBeTruthy();
  }));
});
