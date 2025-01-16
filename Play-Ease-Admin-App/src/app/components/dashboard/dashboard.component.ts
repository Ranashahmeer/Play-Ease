import { Component } from '@angular/core';
import { CalendarComponent } from '../calendar/calendar.component';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
@Component({
  selector: 'app-dashboard',
  // imports: [CalendarComponent],
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  
  // constructor(private formBuilder: FormBuilder,private router: Router) {
  // }
  // RedirectToBooking(){
  //     this.router.navigate(['/bookings']);
  // }
  // RedirectToLogin(){
  //   this.router.navigate(['/login']);
  // }
  // navigateTo(route: string) {
  //   this.router.navigate([route]); // Navigate to the specified route
  // }
}
