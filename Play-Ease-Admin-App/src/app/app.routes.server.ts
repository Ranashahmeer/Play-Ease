import { Routes } from '@angular/router';
import { BookingsComponent } from './components/bookings/bookings.component';

import { SelectedCourtComponent } from './components/selected-court/selected-court.component';
import { NextBookingsComponent } from './components/next-bookings/next-bookings.component';

export const serverRoutes: Routes = [
  {
    path: '**',
    loadComponent: () => import('./app.component').then(m => m.AppComponent),
    data: {
      rendering: 'prerender' // <-- Just use the string
    }
  },
  { path: 'book-now', component: BookingsComponent },
  { path: 'next-page', component: NextBookingsComponent },
  { path: 'court/:name', component: SelectedCourtComponent },

];
