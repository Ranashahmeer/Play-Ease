import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from '../login/login.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  loggedInUser: any = null;
  isMobileMenuOpen = false;
  showProfileDropdown = false;
  private routerSubscription?: Subscription;
  private storageHandler = () => this.checkLoginStatus();
  private logoutHandler = () => this.checkLoginStatus();

  constructor(private router: Router, private dialog: MatDialog,@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.checkLoginStatus();

      // 🔹 Listen to localStorage changes (if user logs in from popup in different tab)
      window.addEventListener('storage', this.storageHandler);
      
      // 🔹 Listen to custom logout event (for same-window logout)
      window.addEventListener('auth:logout', this.logoutHandler);
      
      // 🔹 Also check on route changes
      this.routerSubscription = this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          setTimeout(() => this.checkLoginStatus(), 100);
        });
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('storage', this.storageHandler);
      window.removeEventListener('auth:logout', this.logoutHandler);
    }
    this.routerSubscription?.unsubscribe();
  }
  // 🔹 Check login status
  checkLoginStatus() {
    if (isPlatformBrowser(this.platformId)) {
      this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      this.loggedInUser = this.isLoggedIn
        ? JSON.parse(localStorage.getItem('loggedInUser') || '{}')
        : null;
    }
  }

  // 🔹 Open Login Popup
  RedirectToLogin() {
    if (this.dialog.openDialogs.length > 0) return; // prevent multiple popups
    document.body.classList.add('modal-open');

    const dialogRef = this.dialog.open(LoginComponent, {
      width: '800px',
      height: '1100px',
      panelClass: 'custom-login-dialog',
      backdropClass: 'custom-backdrop',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(() => {
      document.body.classList.remove('modal-open');
      this.checkLoginStatus(); // update navbar after closing
    });
  }

  // 🔹 Book Now
  RedirectToBooking() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      this.router.navigate(['/bookings']);
    } else {
      this.RedirectToLogin();
    }
  }

  // 🔹 My Account
  navigateTo(route: string) {
    if (route === '/my-account' && localStorage.getItem('isLoggedIn') !== 'true') {
      this.RedirectToLogin();
      return;
    }
    this.router.navigate([route]);
  }

  // 🔹 Logout
  logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loggedInUser');
    this.isLoggedIn = false;
    this.loggedInUser = null;
    this.showProfileDropdown = false;
    this.router.navigate(['/home']);
  }

  // 🔹 Toggle profile dropdown
  toggleProfileDropdown(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  // 🔹 Close profile dropdown
  closeProfileDropdown() {
    this.showProfileDropdown = false;
  }

  // 🔹 Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.showProfileDropdown && isPlatformBrowser(this.platformId)) {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown-container')) {
        this.closeProfileDropdown();
      }
    }
  }

  // 🔹 Mobile Menu Toggle
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = '';
  }
}
