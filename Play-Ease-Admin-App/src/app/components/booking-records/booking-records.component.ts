/*  import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';
import { AuthLoginLogoutService } from '../../services/auth/auth.login-logout.service';
import { Router } from '@angular/router';
import { SaveBookingsService } from '../../services/bookings/save-bookings.service';

interface Booking {
  id: number;
  courtName: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  price: number;
  image: string;
  status: 'upcoming' | 'completed';
}

@Component({
  selector: 'app-booking-records',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-records.component.html',
  styleUrls: ['./booking-records.component.css'],
})
export class BookingRecordsComponent implements OnInit {
  teamForm!: FormGroup;
  upcomingBookings: Booking[] = [];
  pastBookings: Booking[] = [];
  showTeamModal = false;
  userId?: number;
  roleId?: number;
  userRoleName: any;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private saveBookingsService: SaveBookingsService,
    public AuthLoginLogoutService: AuthLoginLogoutService,
    private getDataService: GetDatabyDatasourceService
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

    // init team form
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

        // Map bookings
        const today = new Date();
        const bookings = data.map((item, index) => {
          const bookingDate = new Date(item.bookingdate);
          const status: 'upcoming' | 'completed' =
            bookingDate >= today ? 'upcoming' : 'completed';

          return {
            id: index + 1,
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
      },
      error: (err) => {
        console.error('Error fetching account data:', err);
      },
    });
  }
  owner: any = null;
  ownerCourts: any[] = [];
  isOwner?: boolean = false;
  lodeOwnerData() {
    if (!this.userId) return;
    const whereclause = `co.userid = ${this.userId} `;

    this.getDataService.getData(5, whereclause).subscribe({
      next: (apiData: any[] | null | undefined) => {
        const ownerData = Array.isArray(apiData) ? apiData : [];
        if (!ownerData.length) return;

        // map courts owned
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
      error: (err) => {
        console.error('Error fetching owner data:', err);
      },
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
    if (
      !confirm(
        'Are you sure you want to cancel this booking? There will be no refund!'
      )
    )
      return;

    this.saveBookingsService.cancelBooking(bookingId).subscribe({
      next: () => {
        this.upcomingBookings = this.upcomingBookings.filter(
          (b) => b.id !== bookingId
        );
        alert('Booking cancelled successfully');
      },
      error: (err: any) => {
        console.error(err);
        alert('Failed to cancel booking');
      },
    });
  }

  get hasNoBookings(): boolean {
    return this.upcomingBookings.length === 0 && this.pastBookings.length === 0;
  }
}


 */






import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';
import { AuthLoginLogoutService } from '../../services/auth/auth.login-logout.service';
import { Router } from '@angular/router';
import { SaveBookingsService } from '../../services/bookings/save-bookings.service';
/* import { AgGridModule } from 'ag-grid-angular'; */
import { AgGridAngular } from 'ag-grid-angular'; // ✅
import { ColDef, GridOptions } from 'ag-grid-community'; // ✅
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

interface Booking {
  id: number;
  courtName: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  price: number;
  image: string;
  status: 'upcoming' | 'completed';
}

@Component({
  selector: 'app-booking-records',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AgGridAngular],
  templateUrl: './booking-records.component.html',
  styleUrls: ['./booking-records.component.css'],
})
export class BookingRecordsComponent implements OnInit {
  teamForm!: FormGroup;
  upcomingBookings: Booking[] = [];
  pastBookings: Booking[] = [];
  showTeamModal = false;
  userId?: number;
  roleId?: number;
  userRoleName: any;
  owner: any = null;
  ownerCourts: any[] = [];
  isOwner?: boolean = false;
 /* columnDefs: ColDef[] = [ */
  // AG-Grid
  columnDefs: ColDef[] = [
    { field: 'courtName', headerName: 'Court', sortable: true, filter: true, flex: 1 },
    { field: 'date', headerName: 'Date', sortable: true, filter: 'agDateColumnFilter' },
    { field: 'time', headerName: 'Time' },
    { field: 'duration', headerName: 'Duration' ,sortable: true, filter: true},
    { field: 'location', headerName: 'Location', sortable: true, filter: true },
    { field: 'price', headerName: 'Price (Rs)', sortable: true, filter: true },
    { field: 'status', headerName: 'Status',sortable: true, filter: true }
  ];
  
 /*  frameworkComponents = {}; */
  /* gridOptions = { context: { componentParent: this } }; */
  gridOptions: GridOptions = { 
  context: { componentParent: this },
   theme: "legacy",
   defaultColDef: {
    //filter: true          // All columns get filters
   // floatingFilter: true    // All columns get floating filters
  },
  /* enableFilter: true, */
  /* floatingFilter: true, */
  suppressMenuHide: true,
  animateRows: true,
  pagination: true,
  paginationPageSize: 10,
  paginationPageSizeSelector: [5, 10, 20, 50]
};
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private saveBookingsService: SaveBookingsService,
    public AuthLoginLogoutService: AuthLoginLogoutService,
    private getDataService: GetDatabyDatasourceService
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
        this.upcomingBookings = this.upcomingBookings.filter((b) => b.id !== bookingId);
        alert('Booking cancelled successfully');
      },
      error: (err: any) => {
        console.error(err);
        alert('Failed to cancel booking');
      },
    });
  }

  get hasNoBookings(): boolean {
    return this.upcomingBookings.length === 0 && this.pastBookings.length === 0;
  }
}
