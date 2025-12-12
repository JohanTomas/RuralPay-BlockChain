import { TestBed } from '@angular/core/testing';

import { MyQrService } from './my-qr.service';

describe('MyQrService', () => {
  let service: MyQrService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MyQrService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
