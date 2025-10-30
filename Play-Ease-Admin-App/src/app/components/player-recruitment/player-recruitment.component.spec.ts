import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerRecruitmentComponent } from './player-recruitment.component';

describe('PlayerRecruitmentComponent', () => {
  let component: PlayerRecruitmentComponent;
  let fixture: ComponentFixture<PlayerRecruitmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlayerRecruitmentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerRecruitmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with sample requests', () => {
    expect(component.availableRequests.length).toBe(2);
    expect(component.myRequests.length).toBe(0);
  });

  it('should open request modal', () => {
    component.openRequestModal();
    expect(component.showRequestModal).toBe(true);
  });

  it('should close request modal', () => {
    component.showRequestModal = true;
    component.closeRequestModal();
    expect(component.showRequestModal).toBe(false);
  });

  it('should add new request to available requests', () => {
    const newRequest = {
      id: '3',
      title: 'Test Match',
      date: '2025-11-01',
      startTime: '10:00',
      endTime: '12:00',
      location: 'Test Park',
      roles: 'Forward',
      numPlayers: 2,
      price: 300,
      organizer: 'Test User'
    };

    const initialLength = component.availableRequests.length;
    component.handleRequestSubmitted(newRequest);
    expect(component.availableRequests.length).toBe(initialLength + 1);
    expect(component.availableRequests[0]).toEqual(newRequest);
  });

  it('should handle application submission', () => {
    const data = { matchId: '1', role: 'Forward' };
    component.handleApplicationSubmitted(data);
    
    expect(component.myRequests.length).toBe(1);
    expect(component.myRequests[0].applicants.length).toBe(1);
    expect(component.myRequests[0].applicants[0].role).toBe('Forward');
  });

  it('should update applicant status', () => {
    const data = { matchId: '1', role: 'Forward' };
    component.handleApplicationSubmitted(data);
    
    const applicantId = component.myRequests[0].applicants[0].id;
    component.handleApplicantStatusChanged({ 
      requestId: '1', 
      applicantId, 
      status: 'accepted' 
    });
    
    expect(component.myRequests[0].applicants[0].status).toBe('accepted');
  });

  it('should remove expired matches', () => {
    component.availableRequests = [
      {
        id: '1',
        title: 'Past Match',
        date: '2025-01-01',
        startTime: '10:00',
        endTime: '12:00',
        location: 'Test Park',
        roles: 'Forward',
        numPlayers: 2,
        price: 300,
        organizer: 'Test User'
      }
    ];

    component['removeExpiredMatches']();
    expect(component.availableRequests.length).toBe(0);
  });
});