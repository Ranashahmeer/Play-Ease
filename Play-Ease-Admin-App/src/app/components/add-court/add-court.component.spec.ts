import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCourtComponent } from './add-court.component';

describe('AddCourtComponent', () => {
  let component: AddCourtComponent;
  let fixture: ComponentFixture<AddCourtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCourtComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddCourtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
