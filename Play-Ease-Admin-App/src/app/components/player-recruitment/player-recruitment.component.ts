import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavbarComponent } from '../navbar-header/navbar.component';
import { AvailableRequestsComponent } from './available-requests/available-requests.component';
import { MyRequestsComponent } from './my-requests/my-requests.component';
import { RequestModalComponent } from './request-modal/request-modal.component';
import { NavbarFooterComponent } from '../navbar-footer/navbar-footer.component';

import { AuthService } from '../../services/auth/auth.service';
import { MatchService, Applicant , CreateMatchDto } from '../../services/match.service';

// Use the service interfaces directly - no need to redefine them
import { MatchRequest } from '../../services/match.service';
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';

export interface MyRequest extends MatchRequest {
  applicants: Applicant[];
}

@Component({
  selector: 'app-player-recruitment',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    NavbarFooterComponent,
    AvailableRequestsComponent,
    MyRequestsComponent,
    RequestModalComponent
  ],
  templateUrl: './player-recruitment.component.html',
  styleUrls: ['./player-recruitment.component.css']
})
export class PlayerRecruitmentComponent implements OnInit, OnDestroy {
  showRequestModal = false;
  availableRequests: MatchRequest[] = [];
  myRequests: MyRequest[] = [];
  allRequests: MatchRequest[] = [];
  private expiryCheckInterval: any;
  hasFooter = true;
  
  // Current logged-in user info
  currentUserId: number = 0;
  currentUserName: string = '';
  userId: any;

  constructor(
    private matchService: MatchService,
    private authService: AuthService ,private getDataService: GetDatabyDatasourceService // ✅ Inject AuthService
  ) {}

  async ngOnInit(): Promise<void> {
  // ✅ Wait until user info is set before loading requests
  await this.initializeUser();

  this.loadAllRequests();

  // Periodic expiry check
  this.expiryCheckInterval = setInterval(() => this.removeExpiredMatches(), 60000);
  this.removeExpiredMatches();
}



  ngOnDestroy(): void {
    if (this.expiryCheckInterval) {
      clearInterval(this.expiryCheckInterval);
    }
  }

  // ✅ FIXED: Get current logged-in user from AuthService
  private getCurrentUser(): void {
    this.currentUserId = this.authService.getUserId();
    this.currentUserName = this.authService.getUserName();
    
    
    // Fallback to old storage if AuthService returns 0
    if (this.currentUserId === 0) {
      const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
      this.currentUserId = user.userID || user.userId || user.id || 0;
      this.currentUserName = user.fullName || user.name || '';
      
      // Store in AuthService for future use
      if (this.currentUserId !== 0) {
        this.authService.setUser({
          userID: this.currentUserId,
          fullName: this.currentUserName,
          email: user.email || '',
          roleID: user.roleID || user.roleId || 0
        });
      }
    }
  }
// ✅ Add this helper function BELOW getCurrentUser()
private async initializeUser(): Promise<void> {
  this.getCurrentUser();

  // Wait a bit in case AuthService/localStorage needs time
  if (this.currentUserId === 0) {
    await new Promise(resolve => setTimeout(resolve, 300));
    this.getCurrentUser();
  }
}

  // Load all requests from backend and filter them
  private loadAllRequests(): void {
  this.getDataService.getData(7, '').subscribe({
    next: (apiData: any[] | null | undefined) => {
      const data = Array.isArray(apiData) ? apiData : [];
      if (!data.length) return;

      // Map API data
      this.allRequests = data.map(item => ({
        id: item.Id ?? 0,
        title: item.Title ?? 'Untitled Match',
        date: item.Date ?? '',
        startTime: item.StartTime ?? '',
        endTime: item.EndTime ?? '',
        location: item.Location ?? '',
        roles: item.Roles ?? '',
        numPlayers: item.NumPlayers ?? 0,
        price: item.Price ?? 0,
        organizer: item.Organizer ?? 'Unknown',
        organizerId: item.OrganizerId ?? 0,
        isOwn: item.OrganizerId === this.currentUserId,
        createdAt: item.CreatedAt ?? '',
        applicants: Array.isArray(item.Applicants) ? item.Applicants.map((a: { id: any; userId: any; userName: any; role: any; status: any; }) => ({
          id: a.id,
          userId: a.userId,
          userName: a.userName,
          role: a.role,
          status: a.status
        })) : []
      })) as MyRequest[];

      // Filter into available and my requests
      this.filterRequests();
    },
    error: err => {
      console.error('Error fetching match data:', err);
    }
  });
}


private filterRequests(): void {
  // ✅ AVAILABLE REQUESTS: Matches not created by current user
  this.availableRequests = this.allRequests.filter((r: any) => r.organizerId !== this.currentUserId);

  // ✅ MY REQUESTS: Matches created by current user
  const myRequestsData = this.allRequests.filter((r: any) => r.organizerId === this.currentUserId);

// Directly assign myRequests including applicants from API
this.myRequests = myRequestsData.map(r => r as MyRequest);

// No need to call loadApplicantsForRequest anymore

}

  openRequestModal(): void {
    if (!this.authService.isLoggedIn()) {
      alert('Please login first!');
      return;
    }
    this.showRequestModal = true;
  }

  closeRequestModal(): void {
    this.showRequestModal = false;
  }

  // ✅ FIXED: Handle request submission properly
  handleRequestSubmitted(request: any): void {
  const userId = this.authService.getUserId();
  
  if (userId === 0) {
    alert('Please login first!');
    return;
  }

  const matchData: CreateMatchDto = {
    userId: userId,
    title: request.title,
    date: request.date,
    startTime: request.startTime,
    endTime: request.endTime,
    location: request.location,
    roles: request.roles,
    numPlayers: request.numPlayers,
    price: request.price
  };

  console.log('📤 Sending to backend:', matchData);

  this.matchService.createRequest(matchData).subscribe({
    next: (response: MatchRequest) => {
      console.log('✅ Request created successfully:', response);
      alert('Match request created successfully!');
      this.loadAllRequests();
      this.closeRequestModal();
    },
    error: (error: any) => {
      console.error('❌ Error creating request:', error);
      alert('Failed to create request. Please try again.');
    }
  });
}

  // ✅ FIXED: Handle application submission
  handleApplicationSubmitted(data: { matchId: number; role: string }): void {
    const userId = this.authService.getUserId();
    const userName = this.authService.getUserName();
    
    if (userId === 0) {
      alert('Please login first!');
      return;
    }

    const application = {
      matchId: data.matchId,
      userId: userId,
      userName: userName,
      role: data.role
    };

    console.log('📤 Submitting application:', application);

    this.matchService.applyToMatch(application).subscribe({
      next: (response) => {
        console.log('✅ Application submitted successfully:', response);
        alert('Application submitted successfully!');
      },
      error: (error) => {
        console.error('❌ Error applying to match:', error);
        alert('Failed to apply. Please try again.');
      }
    });
  }

  handleApplicantStatusChanged(data: { requestId: number; applicantId: number; status: 'accepted' | 'rejected' }): void {
    this.matchService.updateApplicantStatus(data).subscribe({
      next: (response) => {
        console.log('✅ Applicant status updated');
        // Update local state
        const request = this.myRequests.find(r => r.id === data.requestId);
        if (request) {
          const applicant = request.applicants.find(a => a.id === data.applicantId);
          if (applicant) {
            applicant.status = data.status;
          }
        }
      },
      error: (error) => {
        console.error('❌ Error updating status:', error);
        alert('Failed to update status. Please try again.');
      }
    });
  }

  private removeExpiredMatches(): void {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Filter out expired matches from all requests
    this.allRequests = this.allRequests.filter(request => {
      return request.date > currentDate || 
             (request.date === currentDate && request.endTime > currentTime);
    });

    // Re-filter to update both available and my requests
    this.filterRequests();
  }

  // Method to manually refresh data from backend
  refreshData(): void {
    this.loadAllRequests();
  }
}