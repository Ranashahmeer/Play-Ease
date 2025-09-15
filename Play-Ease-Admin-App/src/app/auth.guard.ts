// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from './components/login/login.component';
import { AuthLoginLogoutService } from './services/auth/auth.login-logout.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private AuthLoginLogoutService: AuthLoginLogoutService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    console.log('[AuthGuard] checking access for', state.url);

    if (this.AuthLoginLogoutService.isAuthenticated()) {
      console.log('[AuthGuard] user logged in → allow');
      return true;
    }

    console.log('[AuthGuard] user not logged in → open login dialog');
    this.dialog.open(LoginComponent, {
      width: '1100px',
      height: '600px',
      data: { redirectUrl: state.url, notice: 'Please log in to continue' }
    });

    return false;
  }
}
