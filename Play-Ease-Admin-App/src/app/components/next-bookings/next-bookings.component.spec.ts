import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NextBookingsComponent } from './next-bookings.component';

describe('NextBookingsComponent', () => {
  let component: NextBookingsComponent;
  let fixture: ComponentFixture<NextBookingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NextBookingsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NextBookingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
