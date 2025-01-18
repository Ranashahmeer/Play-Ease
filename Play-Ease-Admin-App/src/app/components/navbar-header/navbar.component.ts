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

  constructor(private formBuilder: FormBuilder, private dialog: MatDialog,private router: Router) {
  }
  RedirectToBooking(){
      this.router.navigate(['/bookings']);
  }
  RedirectToLogin(){
    
    this.dialog.open(LoginComponent, {
      width: '400px',  // Set fixed width for the popup
      height: 'auto',  // Let height adjust according to content
      maxWidth: '90vw', // Responsive, ensuring it doesn't overflow
    });
  
    // this.router.navigate(['/login']);
  }
  navigateTo(route: string) {
    this.router.navigate([route]); // Navigate to the specified route
  }
}
