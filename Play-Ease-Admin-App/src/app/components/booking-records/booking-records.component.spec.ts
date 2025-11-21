import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingRecordsComponent } from './booking-records.component';

describe('BookingRecordsComponent', () => {
  let component: BookingRecordsComponent;
  let fixture: ComponentFixture<BookingRecordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingRecordsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BookingRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); 
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
