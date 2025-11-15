import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourtBookingComponent } from './court-booking.component';

describe('CourtBookingComponent', () => {
  let component: CourtBookingComponent;
  let fixture: ComponentFixture<CourtBookingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourtBookingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CourtBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
