import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
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
  availableRequests: MyRequest[] = []; // Changed to MyRequest[] to include applicants
  myRequests: MyRequest[] = [];
  allRequests: MyRequest[] = []; // Changed to MyRequest[] to include applicants
  private expiryCheckInterval: any;
  hasFooter = true;
  
  // Current logged-in user info
  currentUserId: number = 0;
  currentUserName: string = '';
  userId: any;

  constructor(
    private matchService: MatchService,
    private authService: AuthService ,private getDataService: GetDatabyDatasourceService,@Inject(PLATFORM_ID) private platformId: Object // ✅ Inject AuthService
  ) {}

  async ngOnInit(): Promise<void> {
  // ✅ Wait until user info is set before loading requests
  await this.initializeUser();

  this.loadAllRequests();

  // Periodic expiry check - run every 5 minutes instead of every minute
  // This prevents too frequent filtering that might cause flickering
  this.expiryCheckInterval = setInterval(() => this.removeExpiredMatches(), 300000); // 5 minutes
  
  // Don't run immediately - wait for data to load first
  // The initial expiry check will happen after data loads
}



  ngOnDestroy(): void {
    if (this.expiryCheckInterval) {
      clearInterval(this.expiryCheckInterval);
    }
  }

  // ✅ FIXED: Get current logged-in user from AuthService
  private getCurrentUser(): void {
  // ❗ Only run in the browser
  if (!isPlatformBrowser(this.platformId)) {
    return;
  }

  const saved = localStorage.getItem("loggedInUser");
  if (saved) {
    try {
      const p = JSON.parse(saved);
      this.currentUserId = p.userID ?? 0;
      this.currentUserName = p.fullName ?? "";
    } catch (err) {
      this.currentUserId = 0;
      this.currentUserName = "";
    }
  } else {
    this.currentUserId = 0;
    this.currentUserName = "";
  }

  // ❗ Fallback if AuthService has no user
  // if (this.currentUserId === 0) {
  //   // still inside browser check
  //   const fallbackUserRaw = localStorage.getItem('loggedInUser') || '{}';
  //   try {
  //     const user = JSON.parse(fallbackUserRaw);
  //     this.currentUserId = user.userId || user.id || 0;
  //     this.currentUserName = user.fullName || user.name || '';

  //     // Store in AuthService for future use
  //     if (this.currentUserId !== 0) {
  //       this.authService.setUser({
  //         userId: this.currentUserId,
  //         fullName: this.currentUserName,
  //         email: user.email || '',
  //         roleId: user.roleId || 0
  //       });
  //     }
  //   } catch (err) {
  //     console.error("Fallback parsing failed:", err);
  //   }
  // }
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
      this.allRequests = data.map(item => {
        // Parse and normalize applicants data
        let applicants: any[] = [];
        if (Array.isArray(item.Applicants)) {
          applicants = item.Applicants;
        } else if (item.Applicants) {
          try {
            applicants = typeof item.Applicants === 'string' 
              ? JSON.parse(item.Applicants) 
              : item.Applicants;
          } catch (e) {
            applicants = [];
          }
        }

        // Normalize applicant field names (handle both camelCase and PascalCase)
        const normalizedApplicants = applicants.map((app: any) => ({
          id: app.id ?? app.Id ?? 0,
          userId: app.userId ?? app.UserId ?? app.user_id ?? 0,
          userName: app.userName ?? app.UserName ?? app.user_name ?? '',
          role: app.role ?? app.Role ?? '',
          status: (app.status ?? app.Status ?? 'pending').toLowerCase(),
          acceptedAt: app.acceptedAt ?? app.AcceptedAt ?? app.accepted_at ?? undefined
        }));

        return {
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
          applicants: normalizedApplicants
        } as MyRequest;
      });

      // Filter into available and my requests
      this.filterRequests();
      
      // After loading data, remove expired matches
      // Use setTimeout to ensure this runs after the view updates
      setTimeout(() => {
        this.removeExpiredMatches();
      }, 100);
    },
    error: err => {
      // Error fetching match data
    }
  });
}


private filterRequests(): void {
  // AVAILABLE REQUESTS: Matches not created by current user (applicants included)
  this.availableRequests = this.allRequests.filter(r => r.organizerId !== this.currentUserId);

  // MY REQUESTS: Only matches created by the current logged-in user (applicants included)
  this.myRequests = this.allRequests.filter(r => r.organizerId === this.currentUserId);
}


  openRequestModal(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }
    this.showRequestModal = true;
  }

  closeRequestModal(): void {
    this.showRequestModal = false;
  }

  // ✅ FIXED: Handle request submission - just refresh data since modal already created the match
  handleRequestSubmitted(request: any): void {
    // The request-modal component already handles the API call via RequestPlayerService
    // We just need to refresh the data to show the new match
    this.loadAllRequests();
  }

  // ✅ FIXED: Handle application submission
  handleApplicationSubmitted(data: { matchId: number; role: string }): void {
    const userId = this.authService.getUserId();
    const userName = this.authService.getUserName();
    
    if (userId === 0) {
      return;
    }

    const application = {
      matchId: data.matchId,
      userId: userId,
      userName: userName,
      role: data.role
    };

    this.matchService.applyToMatch(application).subscribe({
      next: (response) => {
        // Application submitted successfully
      },
      error: (error) => {
        // Error applying to match
      }
    });
  }

  handleApplicantStatusChanged(data: { requestId: number; applicantId: number; status: 'accepted' | 'rejected' }): void {
    this.matchService.updateApplicantStatus(data).subscribe({
      next: (response) => {
        // Update local state
        const request = this.myRequests.find(r => r.id === data.requestId);
        if (request) {
          const applicant = request.applicants.find(a => a.id === data.applicantId);
          if (applicant) {
            applicant.status = data.status;
            // Set acceptedAt timestamp when status changes to accepted
            if (data.status === 'accepted') {
              applicant.acceptedAt = new Date().toISOString();
            }
          }
        }
        // Reload all requests to get updated data from backend
        this.loadAllRequests();
      },
      error: (error) => {
        // Error updating status
      }
    });
  }

  private removeExpiredMatches(): void {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Only filter if we have requests to check
    if (this.allRequests.length === 0) {
      return;
    }

    // Filter out expired matches from all requests
    // A match is expired if:
    // 1. The date has passed (date < currentDate), OR
    // 2. The date is today AND the end time has passed (date === currentDate AND endTime <= currentTime)
    const beforeFilterCount = this.allRequests.length;
    this.allRequests = this.allRequests.filter(request => {
      // If date is in the future, match is still valid
      if (request.date > currentDate) {
        return true;
      }
      
      // If date is today, check if end time has passed
      if (request.date === currentDate) {
        // Match is valid if end time hasn't passed yet
        return request.endTime > currentTime;
      }
      
      // If date is in the past, match is expired
      return false;
    });

    // Only re-filter if data actually changed
    if (this.allRequests.length !== beforeFilterCount) {
      this.filterRequests();
    }
  }

  // Method to manually refresh data from backend
  refreshData(): void {
    this.loadAllRequests();
  }
}