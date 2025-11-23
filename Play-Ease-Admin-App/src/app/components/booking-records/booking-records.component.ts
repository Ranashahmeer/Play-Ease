import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';
import { AuthLoginLogoutService } from '../../services/auth/auth.login-logout.service';
import { Router } from '@angular/router';
import { SaveBookingsService } from '../../services/bookings/save-bookings.service';
import { AlertService } from '../../services/alert.service';
/* import { AgGridModule } from 'ag-grid-angular'; */

interface Booking {
  id: number;
  courtName: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  price: number;
  image: string;
  BookingID:number;
  status: 'upcoming' | 'completed';
}

@Component({
  selector: 'app-booking-records',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './booking-records.component.html',
  styleUrls: ['./booking-records.component.css'],
})
export class BookingRecordsComponent implements OnInit {
  teamForm!: FormGroup;
  upcomingBookings: Booking[] = [];
  pastBookings: Booking[] = [];
  filteredUpcomingBookings: Booking[] = [];
  filteredPastBookings: Booking[] = [];
  showTeamModal = false;
  userId?: number;
  roleId?: number;
  userRoleName: any;
  owner: any = null;
  ownerCourts: any[] = [];
  isOwner?: boolean = false;
  upcomingSearchQuery: string = '';
  pastSearchQuery: string = '';
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private saveBookingsService: SaveBookingsService,
    public AuthLoginLogoutService: AuthLoginLogoutService,
    private getDataService: GetDatabyDatasourceService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('loggedInUser');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        this.userId = p.userID;
        this.roleId = p.roleID;
      } catch {}
    }

    this.teamForm = this.fb.group({
      phone: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
    this.getUserRoleDetails();
  }

  getUserRoleDetails() {
    this.getDataService.getData(4).subscribe({
      next: (apiData: any[] | null | undefined) => {
        const roleData = Array.isArray(apiData) ? apiData : [];
        if (!roleData.length) return;
        const userRole = roleData.find((r) => r.RoleID === this.roleId);
        this.userRoleName = userRole.RoleName;

        if (this.userRoleName == 'User') {
          this.loadUserData();
        } else if (this.userRoleName == 'Owner') {
          this.lodeOwnerData();
          this.isOwner = true;
        } else {
          this.getAdminData();
        }
      },
    });
  }

  getAdminData() {
    console.log('Admin');
  }

  loadUserData(): void {
    if (!this.userId) return;

    const whereclause = `u.userid = ${this.userId} and b.isactive = 1`;

    this.getDataService.getData(3, whereclause).subscribe({
      next: (apiData: any[] | null | undefined) => {
        const data = Array.isArray(apiData) ? apiData : [];
        if (!data.length) return;

        const today = new Date();
        const bookings = data.map((item, index) => {
          const bookingDate = new Date(item.bookingdate);
          const status: 'upcoming' | 'completed' = bookingDate >= today ? 'upcoming' : 'completed';

          return {
            id: index + 1,
            BookingID: item.BookingID ,
            courtName: item.NAME,
            date: bookingDate.toISOString().split('T')[0],
            time: `${item.starttime} - ${item.endtime}`,
            duration: this.calcDuration(item.starttime, item.endtime),
            location: item.location,
            price: item.price,
            image: item.mainimage,
            status,
          } as Booking;
        });

        this.upcomingBookings = bookings.filter((b) => b.status === 'upcoming');
        this.pastBookings = bookings.filter((b) => b.status === 'completed');
        this.filteredUpcomingBookings = [...this.upcomingBookings];
        this.filteredPastBookings = [...this.pastBookings];
      },
      error: (err) => console.error('Error fetching account data:', err),
    });
  }

  lodeOwnerData() {
    if (!this.userId) return;
    const whereclause = `co.userid = ${this.userId}`;

    this.getDataService.getData(5, whereclause).subscribe({
      next: (apiData: any[] | null | undefined) => {
        const ownerData = Array.isArray(apiData) ? apiData : [];
        if (!ownerData.length) return;

        this.ownerCourts = ownerData.map((c) => ({
          courtId: c.courtid,
          name: c.CourtName,
          location: c.location,
          opening: c.openingtime,
          closing: c.closingtime,
          image: c.mainimage,
          rating: c.rating,
        }));
      },
      error: (err) => console.error('Error fetching owner data:', err),
    });
  }

  private calcDuration(start: string, end: string): string {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    const diff = endMins - startMins;
    return `${diff} mins`;
  }

  cancelUpcoming(bookingId: number): void {
    if (!confirm('Are you sure you want to cancel this booking? There will be no refund!'))
      return;

    this.saveBookingsService.cancelBooking(bookingId).subscribe({
      next: () => {
        // Filter by BookingID instead of id
        this.upcomingBookings = this.upcomingBookings.filter((b) => b.BookingID !== bookingId);
        this.filteredUpcomingBookings = this.filteredUpcomingBookings.filter((b) => b.BookingID !== bookingId);
        // Re-apply search filter if active
        if (this.upcomingSearchQuery) {
          this.filterUpcomingBookings(this.upcomingSearchQuery);
        }
        // Emit event to refresh slots in court-booking component
        this.saveBookingsService.emitBookingCancelled(bookingId);
        this.alertService.success('Booking cancelled successfully. The slot is now available again.');
      },
      error: (err: any) => {
        console.error(err);
        this.alertService.error('Failed to cancel booking');
      },
    });
  }

  get hasNoBookings(): boolean {
    return this.upcomingBookings.length === 0 && this.pastBookings.length === 0;
  }

  filterUpcomingBookings(searchQuery: string): void {
    this.upcomingSearchQuery = searchQuery.toLowerCase().trim();
    if (!this.upcomingSearchQuery) {
      this.filteredUpcomingBookings = [...this.upcomingBookings];
      return;
    }

    this.filteredUpcomingBookings = this.upcomingBookings.filter((booking) => {
      const courtName = booking.courtName?.toLowerCase() || '';
      const location = booking.location?.toLowerCase() || '';
      const date = booking.date?.toLowerCase() || '';
      const time = booking.time?.toLowerCase() || '';
      
      return (
        courtName.includes(this.upcomingSearchQuery) ||
        location.includes(this.upcomingSearchQuery) ||
        date.includes(this.upcomingSearchQuery) ||
        time.includes(this.upcomingSearchQuery)
      );
    });
  }

  filterPastBookings(searchQuery: string): void {
    this.pastSearchQuery = searchQuery.toLowerCase().trim();
    if (!this.pastSearchQuery) {
      this.filteredPastBookings = [...this.pastBookings];
      return;
    }

    this.filteredPastBookings = this.pastBookings.filter((booking) => {
      const courtName = booking.courtName?.toLowerCase() || '';
      const location = booking.location?.toLowerCase() || '';
      const date = booking.date?.toLowerCase() || '';
      const time = booking.time?.toLowerCase() || '';
      
      return (
        courtName.includes(this.pastSearchQuery) ||
        location.includes(this.pastSearchQuery) ||
        date.includes(this.pastSearchQuery) ||
        time.includes(this.pastSearchQuery)
      );
    });
  }

  clearUpcomingSearch(): void {
    this.upcomingSearchQuery = '';
    this.filteredUpcomingBookings = [...this.upcomingBookings];
  }

  clearPastSearch(): void {
    this.pastSearchQuery = '';
    this.filteredPastBookings = [...this.pastBookings];
  }
}
