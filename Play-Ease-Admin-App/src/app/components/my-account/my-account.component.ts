import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';
import{AuthLoginLogoutService} from '../../services/auth/auth.login-logout.service'
import { Router } from '@angular/router';
import { SaveBookingsService } from '../../services/bookings/save-bookings.service';
import { AddCourtComponent } from '../add-court/add-court.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard.component';


@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AddCourtComponent, AdminDashboardComponent],
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

  showDashboard = false;
  userId?: number;
  roleId?: number;
  userRoleName: any;
  isOwner?: boolean = false;
  isAdmin?: boolean = false;

  constructor(
    private router: Router,
    public AuthLoginLogoutService: AuthLoginLogoutService,
    private getDataService: GetDatabyDatasourceService
  ) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('loggedInUser');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        this.userId = p.userID;
        this.roleId = p.roleID
      } catch {}
    }

    this.getUserRoleDetails();
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


  addCourt(){
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
}
