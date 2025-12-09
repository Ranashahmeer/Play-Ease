import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HomeComponent } from './components/home/home.component';
import { BookingsComponent } from './components/bookings/bookings.component';
import { ContactUsComponent } from './components/contact-us/contact-us.component';
import { MyAccountComponent } from './components/my-account/my-account.component';
import { OurServicesComponent } from './components/our-services/our-services.component';
import { AddCourtComponent } from './components/add-court/add-court.component';
import { RegisterOwnerComponent } from './components/register-owner/register-owner.component';
import { PlayerRecruitmentComponent } from './components/player-recruitment/player-recruitment.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { CourtListComponent } from './components/court-list/court-list.component';
import { AuthGuard } from './auth.guard';
import { CourtBookingComponent } from './components/court-booking/court-booking.component';
import { ManageSlotsComponent } from './components/manage-slots/manage-slots.component';
import { PaymentApprovalsComponent } from './components/payment-approvals/payment-approvals.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'bookings', component: BookingsComponent, canActivate: [AuthGuard] },
  { path: 'contact-us', component: ContactUsComponent },
  { path: 'my-account', component: MyAccountComponent, canActivate: [AuthGuard] },
  { path: 'our-services', component: OurServicesComponent },
  { path: 'add-court', component: AddCourtComponent },
  { path: 'register-owner', component: RegisterOwnerComponent },
  { path: 'court-list', component: CourtListComponent },
  { path: 'player-recruitment', component: PlayerRecruitmentComponent, canActivate: [AuthGuard] },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: 'manage-slots', component: ManageSlotsComponent, canActivate: [AuthGuard] },
  { path: 'payment-approvals', component: PaymentApprovalsComponent, canActivate: [AuthGuard] },
  { path: 'approve-payment', component: PaymentApprovalsComponent },
  { path: 'reject-payment', component: PaymentApprovalsComponent },
  { path: 'court-booking/:courtId', component: CourtBookingComponent },
  { path: '**', redirectTo: 'dashboard' },
];
