import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { NavbarComponent } from '../navbar-header/navbar.component';
import { AvailableRequestsComponent } from './available-requests/available-requests.component';
import { MyRequestsComponent } from './my-requests/my-requests.component';
import { RequestModalComponent } from './request-modal/request-modal.component';
import { NavbarFooterComponent } from '../navbar-footer/navbar-footer.component';

import { AuthService } from '../../services/auth/auth.service';
import { MatchService, Applicant , CreateMatchDto } from '../../services/match.service';
import { AlertService } from '../../services/alert.service';

// Use the service interfaces directly - no need to redefine them
import { MatchRequest } from '../../services/match.service';
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';

export interface MyRequest extends MatchRequest {
  applicants: Applicant[];
  createdAt?: string;
  remainingSlots?: number; // Calculated: numPlayers - accepted applicants count
  isFullyBooked?: boolean; // true when remainingSlots === 0
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
  private dataRefreshInterval: any; // Auto-refresh for organizers
  hasFooter = true;
  isLoading = false;
  
  // Current logged-in user info
  currentUserId: number = 0;
  currentUserName: string = '';
  userId: any;

  constructor(
    private matchService: MatchService,
    private authService: AuthService,
    private getDataService: GetDatabyDatasourceService,
    private alertService: AlertService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async ngOnInit(): Promise<void> {
    // ✅ Wait until user info is set before loading requests
    await this.initializeUser();

    this.loadAllRequests();

    // Periodic expiry check - run every 5 minutes
    this.expiryCheckInterval = setInterval(() => this.removeExpiredMatches(), 300000);
    
    // Auto-refresh data every 100 seconds for organizers to see new applicants
    this.dataRefreshInterval = setInterval(() => {
      if (this.currentUserId > 0) {
        this.loadAllRequests();
      }
    }, 100000); // 100 seconds
  }



  ngOnDestroy(): void {
    if (this.expiryCheckInterval) {
      clearInterval(this.expiryCheckInterval);
    }
    if (this.dataRefreshInterval) {
      clearInterval(this.dataRefreshInterval);
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

  // Helper method to calculate remaining slots and booking status
  private calculateBookingStatus(request: MyRequest): { remainingSlots: number; isFullyBooked: boolean } {
    const numPlayers = request.numPlayers || 0;
    const acceptedCount = request.applicants?.filter(
      (a: Applicant) => a.status === 'accepted'
    ).length || 0;
    
    const remainingSlots = Math.max(0, numPlayers - acceptedCount);
    const isFullyBooked = remainingSlots === 0;
    
    return { remainingSlots, isFullyBooked };
  }

  // Helper method to map API data to MyRequest
  private mapApiDataToRequest(data: any[]): MyRequest[] {
    if (!data.length) return [];

    return data.map(item => {
      // Parse and normalize applicants data (handle both PascalCase and camelCase)
      let applicants: any[] = [];
      const applicantsData = item.Applicants ?? item.applicants;
      
      if (Array.isArray(applicantsData)) {
        applicants = applicantsData;
      } else if (applicantsData) {
        try {
          applicants = typeof applicantsData === 'string' 
            ? JSON.parse(applicantsData) 
            : applicantsData;
        } catch (e) {
          console.warn('Failed to parse applicants data:', e);
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

      const request: MyRequest = {
        id: item.Id ?? item.id ?? 0,
        title: item.Title ?? item.title ?? 'Untitled Match',
        date: item.Date ?? item.date ?? '',
        startTime: item.StartTime ?? item.startTime ?? item.starttime ?? '',
        endTime: item.EndTime ?? item.endTime ?? item.endtime ?? '',
        location: item.Location ?? item.location ?? '',
        roles: item.Roles ?? item.roles ?? '',
        numPlayers: item.NumPlayers ?? item.numPlayers ?? item.numplayers ?? 0,
        price: item.Price ?? item.price ?? 0,
        organizer: item.Organizer ?? item.organizer ?? 'Unknown',
        organizerId: item.OrganizerId ?? item.organizerId ?? item.organizerid ?? 0,
        isOwn: (item.OrganizerId ?? item.organizerId ?? item.organizerid ?? 0) === this.currentUserId,
        createdAt: item.CreatedAt ?? item.createdAt ?? item.createdat ?? '',
        applicants: normalizedApplicants
      };

      // Calculate remaining slots and booking status
      const bookingStatus = this.calculateBookingStatus(request);
      request.remainingSlots = bookingStatus.remainingSlots;
      request.isFullyBooked = bookingStatus.isFullyBooked;

      return request;
    });
  }


  // Load all requests (for backward compatibility and refresh)
  loadAllRequests(): void {
    this.isLoading = true;
    
    // Even if user is not logged in, we can still show available requests
    // But myRequests will be empty
    if (this.currentUserId === 0) {
      // Load all requests for available section (no filtering by user)
      this.getDataService.getData(7, '').subscribe({
        next: (apiData: any[] | null | undefined) => {
          const data = Array.isArray(apiData) ? apiData : [];
          const mappedRequests = this.mapApiDataToRequest(data);
          
          // Filter out expired matches immediately
          const isExpired = (request: MyRequest): boolean => {
            if (!request.date || !request.endTime) return false;
            
            const now = new Date();
            const currentDate = now.toISOString().split('T')[0];
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            if (!/^\d{4}-\d{2}-\d{2}$/.test(request.date)) {
              return false;
            }
            
            if (request.date > currentDate) {
              return false;
            }
            
            if (request.date === currentDate) {
              const extractTime = (timeStr: string): string => {
                if (!timeStr) return '00:00';
                const parts = timeStr.split(':');
                if (parts.length >= 2) {
                  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
                }
                return '00:00';
              };
              const endTime = extractTime(request.endTime);
              return endTime <= currentTime;
            }
            
            return true;
          };
          
          this.availableRequests = mappedRequests.filter(r => !isExpired(r));
          this.myRequests = [];
          
          // Update allRequests for backward compatibility
          this.updateAllRequests();
          this.isLoading = false;
        },
        error: err => {
          this.availableRequests = [];
          this.myRequests = [];
          this.updateAllRequests();
          this.isLoading = false;
        }
      });
      return;
    }

    // Fetch user's own requests using where clause
    const whereClause = `organizerid = ${this.currentUserId}`;
    
    // Fetch both: user's own requests (with where clause) and all requests (for available + accepted applicants)
    let myOwnRequests: MyRequest[] = [];
    let allRequestsData: MyRequest[] = [];
    let completedCount = 0;
    const totalCalls = 2;
    
    const checkComplete = () => {
      completedCount++;
      if (completedCount === totalCalls) {
        // Helper function to check if a match is expired (same logic as removeExpiredMatches)
        const isExpired = (request: MyRequest): boolean => {
          if (!request.date || !request.endTime) return false;
          
          const now = new Date();
          const currentDate = now.toISOString().split('T')[0];
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          
          // Validate date format
          if (!/^\d{4}-\d{2}-\d{2}$/.test(request.date)) {
            return false;
          }
          
          // If date is in the future, match is still valid
          if (request.date > currentDate) {
            return false;
          }
          
          // If date is today, check if end time has passed
          if (request.date === currentDate) {
            const extractTime = (timeStr: string): string => {
              if (!timeStr) return '00:00';
              const parts = timeStr.split(':');
              if (parts.length >= 2) {
                return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
              }
              return '00:00';
            };
            const endTime = extractTime(request.endTime);
            return endTime <= currentTime;
          }
          
          // If date is in the past, match is expired
          return true;
        };

        // Process available requests: all except user's own, accepted applicants, expired matches, AND fully booked requests
        this.availableRequests = allRequestsData.filter(r => {
          // Remove expired matches first
          if (isExpired(r)) return false;
          // Remove fully booked requests (no remaining slots)
          if (r.isFullyBooked) return false;
          // Remove user's own requests
          if (r.organizerId === this.currentUserId) return false;
          // Remove if user is an accepted applicant
          const isAcceptedApplicant = r.applicants?.some(
            (a: Applicant) => a.userId === this.currentUserId && a.status === 'accepted'
          );
          return !isAcceptedApplicant;
        });

        // Process my requests: 
        // 1. User's own requests (created by current user) - excluding expired
        // 2. Requests where user is an ACCEPTED applicant - excluding expired
        const filteredMyOwnRequests = myOwnRequests.filter(r => {
          // Only include if not expired
          if (isExpired(r)) return false;
          // Double-check: only include if user is the organizer
          return r.organizerId === this.currentUserId;
        });
        
        // Find requests where user is an ACCEPTED applicant (not pending, not rejected)
        const acceptedApplicantRequests = allRequestsData.filter(r => {
          // Remove expired matches
          if (isExpired(r)) return false;
          // Skip if user is the organizer (already in myOwnRequests)
          if (r.organizerId === this.currentUserId) return false;
          // Only include if user has an accepted application
          // Status is already normalized to lowercase in mapApiDataToRequest
          const hasAcceptedApplication = r.applicants?.some(
            (a: Applicant) => {
              // Strict check: userId must match AND status must be exactly 'accepted' (lowercase)
              return a.userId === this.currentUserId && 
                     a.status === 'accepted';
            }
          ) ?? false;
          return hasAcceptedApplication;
        });

        // Combine: user's own requests + accepted applicant requests
        this.myRequests = [...filteredMyOwnRequests, ...acceptedApplicantRequests];
        
        // Update allRequests for backward compatibility
        this.updateAllRequests();
        
        this.isLoading = false;
      }
    };

    // Fetch user's own requests with where clause
    this.getDataService.getData(7, whereClause).subscribe({
      next: (apiData: any[] | null | undefined) => {
        const data = Array.isArray(apiData) ? apiData : [];
        myOwnRequests = this.mapApiDataToRequest(data);
        checkComplete();
      },
      error: err => {
        myOwnRequests = [];
        checkComplete();
      }
    });

    // Fetch all requests (needed for available requests and accepted applicants)
    this.getDataService.getData(7, '').subscribe({
      next: (apiData: any[] | null | undefined) => {
        const data = Array.isArray(apiData) ? apiData : [];
        allRequestsData = this.mapApiDataToRequest(data);
        checkComplete();
      },
      error: err => {
        allRequestsData = [];
        this.alertService.error('Failed to load match requests. Please try again.');
        checkComplete();
      }
    });
  }

  // Keep allRequests for backward compatibility (combines both)
  private updateAllRequests(): void {
    this.allRequests = [...this.availableRequests, ...this.myRequests];
    // Remove duplicates (in case a request appears in both)
    this.allRequests = this.allRequests.filter((request, index, self) =>
      index === self.findIndex(r => r.id === request.id)
    );
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
    this.alertService.success('Match request created successfully!');
    this.loadAllRequests();
  }

  // ✅ FIXED: Handle application submission
  handleApplicationSubmitted(data: { matchId: number; role: string }): void {
    const userId = this.authService.getUserId();
    const userName = this.authService.getUserName();
    
    if (userId === 0) {
      this.alertService.warning('Please log in to apply for matches.');
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
        this.alertService.success(`Application submitted successfully for ${data.role} position!`);
        // Refresh data immediately so organizer can see the new applicant
        this.loadAllRequests();
      },
      error: (error) => {
        const errorMsg = error?.error?.message || 'Failed to submit application. Please try again.';
        if (errorMsg.includes('already applied')) {
          this.alertService.warning('You have already applied to this match.');
        } else {
          this.alertService.error(errorMsg);
        }
      }
    });
  }

  handleApplicantStatusChanged(data: { requestId: number; applicantId: number; status: 'accepted' | 'rejected' }): void {
    this.matchService.updateApplicantStatus(data).subscribe({
      next: (response) => {
        const statusText = data.status === 'accepted' ? 'accepted' : 'rejected';
        this.alertService.success(`Applicant ${statusText} successfully!`);
        
        // Update local state immediately for better UX
        const request = this.myRequests.find(r => r.id === data.requestId);
        if (request) {
          const applicant = request.applicants.find(a => a.id === data.applicantId);
          if (applicant) {
            applicant.status = data.status;
            // Set acceptedAt timestamp when status changes to accepted
            if (data.status === 'accepted') {
              applicant.acceptedAt = new Date().toISOString();
            } else {
              applicant.acceptedAt = undefined;
            }
            // Recalculate remaining slots immediately
            const bookingStatus = this.calculateBookingStatus(request);
            request.remainingSlots = bookingStatus.remainingSlots;
            request.isFullyBooked = bookingStatus.isFullyBooked;
          }
        }
        
        // Also update in availableRequests if the request is there
        const availableRequest = this.availableRequests.find(r => r.id === data.requestId);
        if (availableRequest) {
          const bookingStatus = this.calculateBookingStatus(availableRequest);
          availableRequest.remainingSlots = bookingStatus.remainingSlots;
          availableRequest.isFullyBooked = bookingStatus.isFullyBooked;
        }
        
        // Reload all requests to get updated data from backend and refresh UI
        this.loadAllRequests();
      },
      error: (error) => {
        const errorMsg = error?.error?.message || 'Failed to update applicant status. Please try again.';
        this.alertService.error(errorMsg);
      }
    });
  }

  private removeExpiredMatches(): void {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Helper function to extract HH:MM from database time format (e.g., "12:00:00.0000000" -> "12:00")
    const extractTime = (timeStr: string): string => {
      if (!timeStr) return '00:00';
      // Handle formats like "12:00:00.0000000" or "12:00:00" or "12:00"
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }
      return '00:00';
    };

    // Helper function to check if a match is expired
    const isExpired = (request: MyRequest): boolean => {
      // Don't remove if date or time is missing
      if (!request.date || !request.endTime) {
        return false;
      }
      
      // Validate date format (should be YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(request.date)) {
        console.warn('Invalid date format:', request.date);
        return false; // Don't remove if date format is invalid
      }
      
      // If date is in the future, match is still valid
      if (request.date > currentDate) {
        return false;
      }
      
      // If date is today, check if end time has passed
      if (request.date === currentDate) {
        const endTime = extractTime(request.endTime);
        // Match is expired if end time has passed
        return endTime <= currentTime;
      }
      
      // If date is in the past, match is expired
      return true;
    };

    // Filter out expired matches from available requests
    const beforeAvailableCount = this.availableRequests.length;
    this.availableRequests = this.availableRequests.filter(request => !isExpired(request));

    // Filter out expired matches from my requests
    const beforeMyCount = this.myRequests.length;
    this.myRequests = this.myRequests.filter(request => !isExpired(request));

    // Update allRequests if data changed
    if (this.availableRequests.length !== beforeAvailableCount || 
        this.myRequests.length !== beforeMyCount) {
      this.updateAllRequests();
    }
  }

  // Method to manually refresh data from backend
  refreshData(): void {
    this.loadAllRequests();
  }
}