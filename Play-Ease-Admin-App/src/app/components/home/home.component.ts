import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LoginComponent } from '../login/login.component'; // <-- adjust path if needed
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
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private dialog: MatDialog
  ) {}

  // Open the same login dialog the navbar uses
  openLoginPopup() {
    this.dialog.open(LoginComponent, {
      width: '1100px',
      height: '600px'
    });
  }

  // Optional: keep your navigateTo if you use it elsewhere
  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  // removed scroll code because you removed horizontal scrolling; keep if needed
  scrollLeft() {
    const container = document.querySelector('.features') as HTMLElement;
    if (!container) return;
    const scrollAmount = -260;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  scrollRight() {
    const container = document.querySelector('.features') as HTMLElement;
    if (!container) return;
    const scrollAmount = 260;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
}
