import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { LoginComponent } from '../login/login.component';
@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.component.html', 
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  constructor(
    private router: Router,
    private dialog: MatDialog // Inject MatDialog
  ) { }

  RedirectToBooking() {
    this.router.navigate(['/bookings']);
  }

  // Open login dialog on button click
  RedirectToLogin() {
    this.dialog.open(LoginComponent, {
      width: '1100px', // Set the dialog width if you like
      height: '600px', // Set the dialog width if you like
    });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
