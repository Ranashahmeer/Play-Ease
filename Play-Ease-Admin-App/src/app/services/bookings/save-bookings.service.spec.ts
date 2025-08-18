import { TestBed } from '@angular/core/testing';

import { SaveBookingsService } from './save-bookings.service';

describe('SaveBookingsService', () => {
  let service: SaveBookingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SaveBookingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
