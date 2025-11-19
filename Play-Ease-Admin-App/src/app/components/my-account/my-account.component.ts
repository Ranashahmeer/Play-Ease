import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';
import{AuthLoginLogoutService} from '../../services/auth/auth.login-logout.service'
import { Router } from '@angular/router';
import { SaveBookingsService } from '../../services/bookings/save-bookings.service';
import { AddCourtComponent } from '../add-court/add-court.component';
import { DashboardComponent } from '../dashboard/dashboard.component';

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
  selector: 'app-my-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AddCourtComponent],
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.css']
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

  teamForm!: FormGroup;
  upcomingBookings: Booking[] = [];
  pastBookings: Booking[] = [];
  showTeamModal = false;
  showDashboard = false; // For admin add-court modal
  userId?: number;
  roleId?: number;
  userRoleName: any;
  isOwner?: boolean = false;
  isAdmin?: boolean = false;

  constructor(private fb: FormBuilder,private router: Router,private saveBookingsService: SaveBookingsService ,public AuthLoginLogoutService :AuthLoginLogoutService, private getDataService: GetDatabyDatasourceService) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('loggedInUser');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        this.userId = p.userID;
        this.roleId = p.roleID
      } catch {}
    }

    // init team form
    this.teamForm = this.fb.group({
      phone: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
    this.getUserRoleDetails()
  }
  getUserRoleDetails(){
  this.getDataService.getData(4).subscribe({
        next: (apiData: any[] | null | undefined) => {
          const roleData = Array.isArray(apiData) ? apiData : [];
          if (!roleData.length) return;
          const userRole = roleData.find(r => r.RoleID === this.roleId);
          this.userRoleName = userRole.RoleName; 

        if (this.userRoleName == 'User') {
          this.loadUserData();
        } 
        else if(this.userRoleName == 'Owner'){
          this.lodeOwnerData()
          this.isOwner = true
        }else{
          this.getAdminData()
        }
        }
          });
  }
  getAdminData(){
    this.isAdmin = true;
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
            status
          } as Booking;
        });

        this.upcomingBookings = bookings.filter(b => b.status === 'upcoming');
        this.pastBookings = bookings.filter(b => b.status === 'completed');
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


  private calcDuration(start: string, end: string): string {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    const diff = endMins - startMins;
    return `${diff} mins`;
  }

  cancelUpcoming(bookingId: number): void {
    if (!confirm('Are you sure you want to cancel this booking? There will be no refund!')) return;
  
    this.saveBookingsService.cancelBooking(bookingId).subscribe({
      next: () => {
        this.upcomingBookings = this.upcomingBookings.filter(b => b.id !== bookingId);
      },
      error: (err:any) => {
        // Error cancelling booking
      }
    });
  }
  

  toggleTeamModal(open = true) {
    this.showTeamModal = open;
    if (!open) {
      this.teamForm.reset({ phone: this.user.contact });
    }
  }

  sendTeamRequest(): void {
    if (this.teamForm.invalid) {
      return;
    }
    this.toggleTeamModal(false);
  }

  get hasNoBookings(): boolean {
    return this.upcomingBookings.length === 0 && this.pastBookings.length === 0;
  }
  addCourt(){
    // this.router.navigate(['/my-account']);
    this.router.navigate(['/add-court'])
  }
  logout() {
    this.AuthLoginLogoutService.logout();
  }
}
