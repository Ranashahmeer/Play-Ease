import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';
import { AuthLoginLogoutService } from '../../services/auth/auth.login-logout.service'
import { Router } from '@angular/router';
import { SaveBookingsService } from '../../services/bookings/save-bookings.service';
import { AddCourtComponent } from '../add-court/add-court.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard.component';
import { PlayerRatingsService, PlayerRatingSummary, PlayerRating } from '../../services/player-ratings/player-ratings.service';
import { ContactService, ContactMessage } from '../../services/contact.service';


@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AddCourtComponent, AdminDashboardComponent],
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.css', './contact-queries.css']
})
export class MyAccountComponent implements OnInit {
  // User info (to be filled from API)
  user = {
    name: '',
    age: 0,
    contact: '',
    email: '',
    about: ''
  };

  showDashboard = false;
  userId?: number;
  roleId?: number;
  userRoleName: any;
  isOwner?: boolean = false;
  isAdmin?: boolean = false;

  // Player Ratings
  playerRatingSummary: PlayerRatingSummary | null = null;
  recentPlayerRatings: PlayerRating[] = [];
  isLoadingRatings: boolean = false;

  // Contact Queries (Admin Only)
  contactMessages: ContactMessage[] = [];
  filteredMessages: ContactMessage[] = [];
  selectedStatus: string = 'All';
  selectedCategory: string = 'All';
  isLoadingMessages: boolean = false;
  selectedMessage: ContactMessage | null = null;
  showMessageDetail: boolean = false;

  constructor(
    private router: Router,
    public AuthLoginLogoutService: AuthLoginLogoutService,
    private getDataService: GetDatabyDatasourceService,
    private playerRatingsService: PlayerRatingsService,
    private contactService: ContactService
  ) { }

  ngOnInit(): void {
    const saved = localStorage.getItem('loggedInUser');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        this.userId = p.userID;
        this.roleId = p.roleID
      } catch { }
    }

    this.getUserRoleDetails();
  }
  getUserRoleDetails() {
    this.getDataService.getData(4).subscribe({
      next: (apiData: any[] | null | undefined) => {
        const roleData = Array.isArray(apiData) ? apiData : [];
        if (!roleData.length) return;
        const userRole = roleData.find(r => r.RoleID === this.roleId);
        this.userRoleName = userRole.RoleName;

        if (this.userRoleName == 'User') {
          this.loadUserData();
          this.loadPlayerRatings();
        }
        else if (this.userRoleName == 'Owner') {
          this.lodeOwnerData()
          this.isOwner = true
        } else {
          this.getAdminData()
        }
      }
    });
  }
  getAdminData() {
    this.isAdmin = true;
    this.loadContactQueries();
  }

  toggleDashboard(): void {
    this.showDashboard = !this.showDashboard;
  }

  closeDashboard(): void {
    this.showDashboard = false;
  }

  openDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
  loadUserData(): void {
    if (!this.userId) return;

    const whereclause = `u.userid = ${this.userId} and b.isactive = 1`;

    this.getDataService.getData(3, whereclause).subscribe({
      next: (apiData: any[] | null | undefined) => {
        const data = Array.isArray(apiData) ? apiData : [];
        if (!data.length) return;

        //Fill user info (from first record)
        const first = data[0];
        this.user = {
          name: first.FullName,
          age: 28, // you can extend API to send age if available
          contact: first.Phone,
          email: first.Email,
          about: first.about
        };

      },
      error: err => {
        // Error fetching account data
      }
    });
  }
  owner: any = null;
  ownerCourts: any[] = [];
  lodeOwnerData() {
    if (!this.userId) return;
    const whereclause = `co.userid = ${this.userId} `;

    this.getDataService.getData(5, whereclause).subscribe({
      next: (apiData: any[] | null | undefined) => {
        const ownerData = Array.isArray(apiData) ? apiData : [];
        if (!ownerData.length) return;

        // extract owner info (from first record)
        const first = ownerData[0];
        this.owner = {
          fullname: first.fullname,
          email: first.email,
          phone: first.phone,
          cnic: first.cnic,
          about: first.about
        };

        // map courts owned
        this.ownerCourts = ownerData.map(c => ({
          courtId: c.courtid,
          name: c.CourtName,
          location: c.location,
          opening: c.openingtime,
          closing: c.closingtime,
          image: c.mainimage,
          rating: c.rating
        }));
      },
      error: err => {
        // Error fetching owner data
      }
    });
  }


  addCourt() {
    // this.router.navigate(['/my-account']);
    this.router.navigate(['/add-court'])
  }

  navigateToManageSlots(): void {
    this.router.navigate(['/manage-slots']);
  }

  navigateToPaymentApprovals(): void {
    this.router.navigate(['/payment-approvals']);
  }

  logout() {
    this.AuthLoginLogoutService.logout();
  }

  loadPlayerRatings(): void {
    if (!this.userId) return;

    this.isLoadingRatings = true;

    // Load rating summary
    this.playerRatingsService.getUserRatingSummary(this.userId).subscribe({
      next: (summary) => {
        this.playerRatingSummary = summary;
        this.isLoadingRatings = false;
      },
      error: (err) => {
        console.error('Error loading player rating summary:', err);
        this.isLoadingRatings = false;
      }
    });

    // Load recent ratings
    this.playerRatingsService.getUserRatings(this.userId, 5, false).subscribe({
      next: (ratings) => {
        this.recentPlayerRatings = ratings;
      },
      error: (err) => {
        console.error('Error loading player ratings:', err);
      }
    });
  }

  getStarRating(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  navigateToRegisterOwner(): void {
    this.router.navigate(['/register-owner']);
  }

  navigateToAddCourt(): void {
    this.router.navigate(['/add-court']);
  }

  Math = Math;

  // Contact Queries Methods (Admin Only)
  loadContactQueries(): void {
    if (!this.isAdmin) return;

    this.isLoadingMessages = true;
    this.contactService.getMessages().subscribe({
      next: (messages) => {
        this.contactMessages = messages;
        this.applyFilters();
        this.isLoadingMessages = false;
      },
      error: (err) => {
        console.error('Error loading contact messages:', err);
        this.isLoadingMessages = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredMessages = this.contactMessages.filter(msg => {
      const statusMatch = this.selectedStatus === 'All' || msg.status === this.selectedStatus;
      const categoryMatch = this.selectedCategory === 'All' || msg.category === this.selectedCategory;
      return statusMatch && categoryMatch;
    });
  }

  onStatusFilterChange(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  onCategoryFilterChange(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  viewMessageDetail(message: ContactMessage): void {
    this.selectedMessage = message;
    this.showMessageDetail = true;
  }

  closeMessageDetail(): void {
    this.showMessageDetail = false;
    this.selectedMessage = null;
  }

  markAsResolved(messageId: number): void {
    this.contactService.updateMessageStatus(messageId, 'Resolved').subscribe({
      next: () => {
        // Update local state
        const message = this.contactMessages.find(m => m.messageId === messageId);
        if (message) {
          message.status = 'Resolved';
          message.resolvedAt = new Date();
        }
        this.applyFilters();
        this.closeMessageDetail();
      },
      error: (err) => {
        console.error('Error updating message status:', err);
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'New': return 'status-new';
      case 'InProgress': return 'status-inprogress';
      case 'Resolved': return 'status-resolved';
      default: return '';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'High': return 'priority-high';
      case 'Normal': return 'priority-normal';
      case 'Low': return 'priority-low';
      default: return '';
    }
  }
}
