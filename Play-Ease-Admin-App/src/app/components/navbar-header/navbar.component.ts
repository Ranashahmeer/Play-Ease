import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  constructor(private formBuilder: FormBuilder,private router: Router) {
  }
  RedirectToBooking(){
      this.router.navigate(['/bookings']);
  }
  RedirectToLogin(){
    this.router.navigate(['/login']);
  }
  navigateTo(route: string) {
    this.router.navigate([route]); // Navigate to the specified route
  }
}
