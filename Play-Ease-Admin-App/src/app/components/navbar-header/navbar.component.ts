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
})
export class NavbarComponent {

  constructor(
    private router: Router,
    private dialog: MatDialog
  ) { }

  RedirectToBooking() {
    this.router.navigate(['/bookings']);
  }

  RedirectToLogin() {
    this.dialog.open(LoginComponent, {
      width: '1100px',
      height: '600px',
      panelClass: 'custom-login-dialog'
    });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
