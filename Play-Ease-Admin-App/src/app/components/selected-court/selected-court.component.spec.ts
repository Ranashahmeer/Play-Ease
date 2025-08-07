import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectedCourtComponent } from './selected-court.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('SelectedCourtComponent', () => {
  let component: SelectedCourtComponent;
  let fixture: ComponentFixture<SelectedCourtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectedCourtComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ name: 'Test Court' }) // Mock route param
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SelectedCourtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
