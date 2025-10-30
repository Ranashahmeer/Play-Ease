/* import { Injectable } from '@angular/core'; */
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthLoginLogoutService {
  private loggedIn = false;

  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}

  // Call this on successful login
  login() {
    this.loggedIn = true;
    /* localStorage.setItem('isLoggedIn', 'true');  */// persist session
     if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('isLoggedIn', 'true'); // persist session
    }
  }

  // Call this on logout
  logout() {
    this.loggedIn = false;
   /*  localStorage.removeItem('isLoggedIn'); */
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('isLoggedIn');
    }
    this.router.navigate(['/']); // redirect to home
  }

  isAuthenticated(): boolean {
     if (isPlatformBrowser(this.platformId)) {
      return this.loggedIn || localStorage.getItem('isLoggedIn') === 'true';
    }
    return false;
    /* return this.loggedIn || localStorage.getItem('isLoggedIn') === 'true'; */
  }
}
