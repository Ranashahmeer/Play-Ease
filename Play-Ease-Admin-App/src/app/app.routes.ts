import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HomeComponent } from './components/home/home.component';
import { BookingsComponent } from './components/bookings/bookings.component';
import { ContactUsComponent } from './components/contact-us/contact-us.component';
import { MyAccountComponent } from './components/my-account/my-account.component';
import { OurServicesComponent } from './components/our-services/our-services.component';
import { AddCourtComponent } from './components/add-court/add-court.component';
import { PlayerRecruitmentComponent } from './components/player-recruitment/player-recruitment.component';


import { AuthGuard } from './auth.guard';

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
  { path: 'bookings', component: BookingsComponent, canActivate: [AuthGuard] },
  { path: 'contact-us', component: ContactUsComponent },
  { path: 'my-account', component: MyAccountComponent, canActivate: [AuthGuard]  },
  { path: 'our-services', component: OurServicesComponent },
  { path: 'add-court', component: AddCourtComponent },
  { path: 'player-recruitment', component: PlayerRecruitmentComponent },
  { path: '**', redirectTo: 'dashboard' }, // Fallback route
];
