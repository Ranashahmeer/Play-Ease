import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AddCourtComponent } from '../add-court/add-court.component';
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';
import { AlertService } from '../../services/alert.service';
import { HttpClient } from '@angular/common/http';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'player' | 'courtOwner';
  joinedDate: string;
}

export interface Booking {
  id: string;
  courtName: string;
  playerName: string;
  date: string;
  time: string;
  paymentStatus: 'confirmed' | 'pending' | 'completed';
  price: number;
  bookedDate: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AddCourtComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  // Active tab
  activeTab: 'users' | 'bookings' | 'courts' = 'users';

  // Search and filter
  searchQuery = '';
  selectedFilter = 'all';

  // Data
  users: User[] = [];
  bookings: Booking[] = [];
  isLoadingUsers = false;
  isLoadingBookings = false;

  // Filtered data
  filteredUsers: User[] = [];
  filteredBookings: Booking[] = [];

  // Modals
  showUserDeleteModal = false;
  selectedUser: User | null = null;

  // Notifications
  showNotification = false;
  notificationText = '';

  private apiUrl = 'http://localhost:5000/api';

  constructor(
    private dataService: GetDatabyDatasourceService,
    private alertService: AlertService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadBookings();
  }

  // Load users from backend
  loadUsers(): void {
    this.isLoadingUsers = true;
    this.dataService.getData(23, 'U.isactive = 1 AND R.RoleID <> 1').subscribe({
      next: (apiData: any[] | null | undefined) => {
        const data = Array.isArray(apiData) ? apiData : [];
        this.users = data.map((item, index) => {
          const roleName = item.RoleName ;
          return {
            id: item.UserID?.toString(),
            name: item.FullName,
            email: item.Email ,
            phone: item.Phone ,
            role: roleName.toLowerCase().includes('owner') ? 'courtOwner' : 'player',
            joinedDate: item.CreatedAt.split('T')[0]
          } as User;
        });
        this.isLoadingUsers = false;
        this.applyFilters();
      },
      error: (err: any) => {
        console.error('Error loading users:', err);
        this.alertService.error('Failed to load users');
        this.isLoadingUsers = false;
      }
    });
  }

  // Load bookings from backend
  loadBookings(): void {
    this.isLoadingBookings = true;
    // Using datasource 3 for bookings (as seen in other components)
    this.dataService.getData(3, 'b.IsActive = 1').subscribe({
      next: (apiData: any[] | null | undefined) => {
        const data = Array.isArray(apiData) ? apiData : [];
        this.bookings = data.map((item, index) => {
          // Map backend data to Booking interface
          const bookingDate = item.BookingDate || item.bookingDate;
          const startTime = item.StartTime || item.startTime || '';
          const endTime = item.EndTime || item.endTime || '';
          
          // Format time
          const timeStr = this.formatTimeRange(startTime, endTime);
          
          // Determine payment status
          let paymentStatus: 'confirmed' | 'pending' | 'completed' = 'pending';
          if (item.PaymentApprovalStatus === 'Approved' || item.PaymentStatus === 'Confirmed') {
            paymentStatus = 'confirmed';
          } else if (item.PaymentApprovalStatus === 'Pending' || item.PaymentStatus === 'Pending') {
            paymentStatus = 'pending';
          }
          
          // Check if booking is completed (date has passed)
          if (bookingDate) {
            const bookingDateObj = new Date(bookingDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (bookingDateObj < today) {
              paymentStatus = 'completed';
            }
          }
          
          return {
            id: item.BookingID?.toString() || item.bookingID?.toString() || (index + 1).toString(),
            courtName: item.NAME || item.CourtName || item.courtName || 'Unknown Court',
            playerName: item.FullName || item.fullName || item.UserName || 'Unknown User',
            date: bookingDate ? new Date(bookingDate).toISOString().split('T')[0] : '',
            time: timeStr,
            paymentStatus: paymentStatus,
            price: item.Price || item.price || 0,
            bookedDate: item.CreatedAt || item.createdAt || new Date().toISOString().split('T')[0]
          } as Booking;
        });
        this.isLoadingBookings = false;
        this.applyFilters();
      },
      error: (err: any) => {
        console.error('Error loading bookings:', err);
        this.alertService.error('Failed to load bookings');
        this.isLoadingBookings = false;
      }
    });
  }

  private formatTimeRange(startTime: string, endTime: string): string {
    if (!startTime || !endTime) return '';
    
    // Handle TimeSpan format (HH:MM:SS) or time string
    const formatTime = (time: string): string => {
      if (!time) return '';
      // If it's in HH:MM:SS format, extract HH:MM
      if (time.includes(':')) {
        const parts = time.split(':');
        const hours = parseInt(parts[0]);
        const minutes = parts[1];
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
        return `${displayHours}:${minutes} ${period}`;
      }
      return time;
    };
    
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  }

  // Tab switching
  switchTab(tab: 'users' | 'bookings' | 'courts'): void {
    this.activeTab = tab;
    this.searchQuery = '';
    this.selectedFilter = 'all';
    
    // Load data when switching tabs
    if (tab === 'users' && this.users.length === 0) {
      this.loadUsers();
    } else if (tab === 'bookings' && this.bookings.length === 0) {
      this.loadBookings();
    } else {
      this.applyFilters();
    }
  }

  // Apply filters
  applyFilters(): void {
    if (this.activeTab === 'users') {
      this.filterUsers();
    } else if (this.activeTab === 'bookings') {
      this.filterBookings();
    }
  }

  private filterUsers(): void {
    let filtered = [...this.users];

    // Filter by role
    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(u => u.role === this.selectedFilter);
    }

    // Search
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }

    this.filteredUsers = filtered;
  }

  private filterBookings(): void {
    let filtered = [...this.bookings];

    // Filter by payment status
    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(b => b.paymentStatus === this.selectedFilter);
    }

    // Search
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.courtName.toLowerCase().includes(query) ||
        b.playerName.toLowerCase().includes(query)
      );
    }

    // Auto-update payment status to completed if booking date has passed
    const now = new Date();
    filtered.forEach(b => {
      const bookingDate = new Date(b.date);
      if (bookingDate < now && b.paymentStatus !== 'completed') {
        b.paymentStatus = 'completed';
      }
    });

    this.filteredBookings = filtered;
  }

  // User actions
  openDeleteUserModal(user: User): void {
    this.selectedUser = user;
    this.showUserDeleteModal = true;
  }

  confirmDeleteUser(): void {
    if (!this.selectedUser) return;

    const userId = parseInt(this.selectedUser.id);
    if (!userId || isNaN(userId)) {
      this.alertService.error('Invalid user ID');
      this.closeDeleteUserModal();
      return;
    }

    const userName = this.selectedUser.name;
    const userIdToRemove = this.selectedUser.id;

    // Call backend API to deactivate user (soft delete)
    this.http.put(`${this.apiUrl}/Users/deactivate/${userId}`, {}).subscribe({
      next: () => {
        // Remove from local array and refresh
        this.users = this.users.filter(u => u.id !== userIdToRemove);
        this.applyFilters();
        this.alertService.success(`User ${userName} has been deactivated.`);
        this.closeDeleteUserModal();
      },
      error: (err: any) => {
        console.error('Error deactivating user:', err);
        this.alertService.error(err?.error?.error || 'Failed to deactivate user');
        this.closeDeleteUserModal();
      }
    });
  }

  closeDeleteUserModal(): void {
    this.showUserDeleteModal = false;
    this.selectedUser = null;
  }

  // Helper methods
  getRoleBadgeClass(role: string): string {
    return role === 'player' ? 'badge-player' : 'badge-owner';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'confirmed': return 'badge-confirmed';
      case 'pending': return 'badge-pending';
      case 'completed': return 'badge-completed';
      default: return '';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  private displayNotification(message: string): void {
    this.notificationText = message;
    this.showNotification = true;
    setTimeout(() => {
      this.showNotification = false;
    }, 3000);
  }
}