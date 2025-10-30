import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearhBarComponent } from './searh-bar.component';

describe('SearhBarComponent', () => {
  let component: SearhBarComponent;
  let fixture: ComponentFixture<SearhBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearhBarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SearhBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
