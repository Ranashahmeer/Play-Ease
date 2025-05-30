import { Routes } from '@angular/router';

export const serverRoutes: Routes = [
  {
    path: '**',
    loadComponent: () => import('./app.component').then(m => m.AppComponent),
    data: {
      rendering: 'prerender' // <-- Just use the string
    }
  }
];
