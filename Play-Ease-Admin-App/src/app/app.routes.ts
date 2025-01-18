import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { HomeComponent } from './components/home/home.component';
import { BookingsComponent } from './components/bookings/bookings.component';
import { ContactUsComponent } from './components/contact-us/contact-us.component';
import { MyAccountComponent } from './components/my-account/my-account.component';
import { OurServicesComponent } from './components/our-services/our-services.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' }, // Redirect to login
  {
    path: 'dashboard',
    component: DashboardComponent,
    // children: [
    //   // { path: '', redirectTo: 'calendar', pathMatch: 'full' }, // Redirect to calendar
    //   { path: 'calendar', component: CalendarComponent },      // Calendar route
    // ],
  },
  { path: 'login', component: LoginComponent },         // Login route
  { path: 'home', component: HomeComponent },
  { path: 'bookings', component: BookingsComponent },
  { path: 'contact-us', component: ContactUsComponent },
  { path: 'my-account', component: MyAccountComponent },
  { path: 'our-services', component: OurServicesComponent },
  { path: '**', redirectTo: 'dashboard' }, // Fallback route
];
