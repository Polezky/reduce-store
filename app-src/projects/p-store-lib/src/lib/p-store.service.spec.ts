import { TestBed, inject } from '@angular/core/testing';

import { RStore } from './p-store.service';

describe('PStoreService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RStore]
    });
  });

  it('should be created', inject([RStore], (service: RStore) => {
    expect(service).toBeTruthy();
  }));
});
