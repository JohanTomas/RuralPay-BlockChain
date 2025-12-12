import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyQrComponent } from './my-qr.component';

describe('MyQrComponent', () => {
  let component: MyQrComponent;
  let fixture: ComponentFixture<MyQrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyQrComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyQrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
