import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from '../login/login.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button'; // Add any Material modules you use
import { MatIconModule } from '@angular/material/icon';     // Example

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    // Add any other modules or components used in navbar.component.html
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})export class NavbarComponent {
  isLoggedIn = false;
  loggedInUser: any = null;

  constructor(
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    this.loggedInUser = this.isLoggedIn ? JSON.parse(localStorage.getItem('loggedInUser') || '{}') : null;
  }

  RedirectToBooking() {
    this.router.navigate(['/bookings']);
  }

  RedirectToLogin() {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '1100px',
      height: '600px',
      panelClass: 'custom-login-dialog'
    });

    // after login close, refresh status
    dialogRef.afterClosed().subscribe(() => {
      this.checkLoginStatus();
    });
  }

  logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loggedInUser');
    this.checkLoginStatus();
    this.router.navigate(['/']);
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
