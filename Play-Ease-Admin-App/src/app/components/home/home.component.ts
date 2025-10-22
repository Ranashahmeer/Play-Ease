import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LoginComponent } from '../login/login.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeComponent {
  isLoggedIn = false;

  constructor(private router: Router, private dialog: MatDialog) {}
  
  ngOnInit() {
    this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  }
  // ✅ Opens the same login popup as navbar
  openLoginPopup() {
  // 🛑 Prevent opening multiple dialogs
  if (this.dialog.openDialogs.length > 0) return;

  document.body.classList.add('modal-open');

  const dialogRef = this.dialog.open(LoginComponent, {
    width: '800px',
    height: '750px',
    panelClass: 'custom-login-dialog',
    backdropClass: 'custom-backdrop',
    disableClose: true
  });

  dialogRef.afterClosed().subscribe(() => {
    document.body.classList.remove('modal-open');
  });
}

  // ✅ For "Get Started" button
  getStarted() {
    this.openLoginPopup(); // same login popup
  }

  // ✅ Optional if you still have other buttons on home page
  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  // (optional scroll controls if you still use features section)
  scrollLeft() {
    const container = document.querySelector('.features') as HTMLElement;
    if (container) container.scrollBy({ left: -260, behavior: 'smooth' });
  }

  scrollRight() {
    const container = document.querySelector('.features') as HTMLElement;
    if (container) container.scrollBy({ left: 260, behavior: 'smooth' });
  }
}
