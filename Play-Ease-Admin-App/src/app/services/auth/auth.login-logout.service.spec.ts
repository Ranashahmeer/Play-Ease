import { TestBed } from '@angular/core/testing';

import { AuthLoginLogoutService } from './auth.login-logout.service';

describe('AuthLoginLogoutService', () => {
  let service: AuthLoginLogoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthLoginLogoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
