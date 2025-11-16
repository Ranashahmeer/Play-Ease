import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavbarFooterComponent } from '../navbar-footer/navbar-footer.component';
import { NavbarComponent } from '../navbar-header/navbar.component';
import { AddCourtComponent } from '../add-court/add-court.component';

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
    NavbarComponent,
    NavbarFooterComponent,
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

  // Filtered data
  filteredUsers: User[] = [];
  filteredBookings: Booking[] = [];

  // Modals
  showUserDeleteModal = false;
  selectedUser: User | null = null;

  // Notifications
  showNotification = false;
  notificationText = '';

  ngOnInit(): void {
    this.loadMockData();
    this.applyFilters();
  }

  // Load mock data (replace with API calls)
  private loadMockData(): void {
    // Mock Users
    this.users = [
      {
        id: '1',
        name: 'Ahmed Khan',
        email: 'ahmed.khan@email.com',
        phone: '+92 300 1234567',
        role: 'player',
        joinedDate: '2024-01-15'
      },
      {
        id: '2',
        name: 'Sara Ali',
        email: 'sara.ali@email.com',
        phone: '+92 321 9876543',
        role: 'player',
        joinedDate: '2024-02-20'
      },
      {
        id: '3',
        name: 'Bilal Sports Complex',
        email: 'bilal@sportsplex.com',
        phone: '+92 333 5555555',
        role: 'courtOwner',
        joinedDate: '2024-01-10'
      },
      {
        id: '4',
        name: 'Hassan Malik',
        email: 'hassan@email.com',
        phone: '+92 345 7777777',
        role: 'player',
        joinedDate: '2024-03-05'
      }
    ];

    // Mock Bookings
    this.bookings = [
      {
        id: '1',
        courtName: 'City Basketball Court',
        playerName: 'Ahmed Khan',
        date: '2024-11-10',
        time: '10:00 AM - 12:00 PM',
        paymentStatus: 'confirmed',
        price: 1500,
        bookedDate: '2024-11-08'
      },
      {
        id: '2',
        courtName: 'Greenfield Football Arena',
        playerName: 'Sara Ali',
        date: '2024-11-12',
        time: '4:00 PM - 6:00 PM',
        paymentStatus: 'confirmed',
        price: 2500,
        bookedDate: '2024-11-07'
      },
      {
        id: '3',
        courtName: 'Tennis Academy Courts',
        playerName: 'Ahmed Khan',
        date: '2025-11-20',
        time: '8:00 AM - 10:00 AM',
        paymentStatus: 'pending',
        price: 3000,
        bookedDate: '2025-11-15'
      },
      {
        id: '4',
        courtName: 'City Basketball Court',
        playerName: 'Hassan Malik',
        date: '2025-12-01',
        time: '2:00 PM - 4:00 PM',
        paymentStatus: 'pending',
        price: 1500,
        bookedDate: '2025-11-20'
      }
    ];
  }

  // Tab switching
  switchTab(tab: 'users' | 'bookings' | 'courts'): void {
    this.activeTab = tab;
    this.searchQuery = '';
    this.selectedFilter = 'all';
    this.applyFilters();
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
    if (this.selectedUser) {
      this.users = this.users.filter(u => u.id !== this.selectedUser!.id);
      this.applyFilters();
      this.displayNotification(`User ${this.selectedUser.name} has been deleted.`);
      this.closeDeleteUserModal();
    }
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