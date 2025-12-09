import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRatingBadgeComponent } from './user-rating-badge.component';

describe('UserRatingBadgeComponent', () => {
  let component: UserRatingBadgeComponent;
  let fixture: ComponentFixture<UserRatingBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRatingBadgeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UserRatingBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

