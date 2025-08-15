import { TestBed } from '@angular/core/testing';

import { GetDatabyDatasourceService } from './get-databy-datasource.service';

describe('GetDatabyDatasourceService', () => {
  let service: GetDatabyDatasourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetDatabyDatasourceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
