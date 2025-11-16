import { TestBed } from '@angular/core/testing';

import { RequestPlayerService } from './request-player.service';

describe('RequestPlayerService', () => {
  let service: RequestPlayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RequestPlayerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
