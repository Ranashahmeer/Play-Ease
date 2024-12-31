import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CalendarComponent } from './components/calendar/calendar.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' }, // Redirect to login
  { path: 'login', component: LoginComponent },         // Login route
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      // { path: '', redirectTo: 'calendar', pathMatch: 'full' }, // Redirect to calendar
      { path: 'calendar', component: CalendarComponent },      // Calendar route
    ],
  },
  { path: '**', redirectTo: 'login' }, // Fallback route
];
