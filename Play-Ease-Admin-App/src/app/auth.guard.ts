import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from './components/login/login.component'; // <- correct path for your project

@Injectable({
  providedIn: 'root'
})

export class AuthGuard implements CanActivate {
  constructor(private router: Router, private dialog: MatDialog) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
  console.log('[AuthGuard] canActivate called for', state.url);
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  console.log('[AuthGuard] isLoggedIn =', isLoggedIn);

  if (isLoggedIn) {
    console.log('[AuthGuard] allowing navigation');
    return true;
  }

  console.log('[AuthGuard] blocking navigation and attempting to open login dialog');
  try {
    this.dialog.open(LoginComponent, {
      width: '1100px',
      height: '600px',
      data: { redirectUrl: state.url, notice: 'Please log in to continue' }
    });
    console.log('[AuthGuard] dialog.open() called');
  } catch (err) {
    console.error('[AuthGuard] dialog.open() failed:', err);
  }

  return false;
}
}