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
    if (this.AuthLoginLogoutService.isAuthenticated()) {
      return true;
    }
    
    // Prevent multiple dialogs
    if (this.dialog.openDialogs.length > 0) {
      return false;
    }
    
    document.body.classList.add('modal-open');
    
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '800px',
      height: '1100px',
      panelClass: 'custom-login-dialog',
      backdropClass: 'custom-backdrop',
      disableClose: true,
      data: { redirectUrl: state.url, notice: 'Please log in to continue' }
    });

    dialogRef.afterClosed().subscribe(() => {
      document.body.classList.remove('modal-open');
    });

    return false;
  }
}
