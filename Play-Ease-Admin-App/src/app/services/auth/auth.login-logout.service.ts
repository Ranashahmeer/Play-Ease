import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthLoginLogoutService {
  private loggedIn = false;

  constructor(private router: Router) {}

  // Call this on successful login
  login() {
    this.loggedIn = true;
    localStorage.setItem('isLoggedIn', 'true'); // persist session
  }

  // Call this on logout
  logout() {
    this.loggedIn = false;
    localStorage.removeItem('isLoggedIn');
    this.router.navigate(['/']); // redirect to home
  }

  isAuthenticated(): boolean {
    return this.loggedIn || localStorage.getItem('isLoggedIn') === 'true';
  }
}
