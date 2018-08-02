import { TestBed, inject } from '@angular/core/testing';

import { RStore } from './rstore.service';

describe('RStore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RStore]
    });
  });

  it('should be created', inject([RStore], (service: RStore) => {
    expect(service).toBeTruthy();
  }));
});
