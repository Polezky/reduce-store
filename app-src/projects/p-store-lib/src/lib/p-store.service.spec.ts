import { TestBed, inject } from '@angular/core/testing';

import { PStoreService } from './p-store.service';

describe('PStoreService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PStoreService]
    });
  });

  it('should be created', inject([PStoreService], (service: PStoreService) => {
    expect(service).toBeTruthy();
  }));
});
