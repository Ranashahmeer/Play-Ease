import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from '../login/login.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;
  loggedInUser: any = null;

  constructor(private router: Router, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.checkLoginStatus();

    // 🔹 Also listen to localStorage changes (if user logs in from popup)
    window.addEventListener('storage', () => this.checkLoginStatus());
  }

  // 🔹 Check login status
  checkLoginStatus() {
    this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    this.loggedInUser = this.isLoggedIn
      ? JSON.parse(localStorage.getItem('loggedInUser') || '{}')
      : null;
  }

  // 🔹 Open Login Popup
  RedirectToLogin() {
    if (this.dialog.openDialogs.length > 0) return; // prevent multiple popups
    document.body.classList.add('modal-open');

    const dialogRef = this.dialog.open(LoginComponent, {
      width: '800px',
      height: '1100px',
      panelClass: 'custom-login-dialog',
      backdropClass: 'custom-backdrop',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(() => {
      document.body.classList.remove('modal-open');
      this.checkLoginStatus(); // update navbar after closing
    });
  }

  // 🔹 Book Now
  RedirectToBooking() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      this.router.navigate(['/bookings']);
    } else {
      this.RedirectToLogin();
    }
  }

  // 🔹 My Account
  navigateTo(route: string) {
    if (route === '/my-account' && localStorage.getItem('isLoggedIn') !== 'true') {
      this.RedirectToLogin();
      return;
    }
    this.router.navigate([route]);
  }

  // 🔹 Logout
  logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loggedInUser');
    this.isLoggedIn = false;
    this.loggedInUser = null;
    this.router.navigate(['/home']);
  }
}
