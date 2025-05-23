import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    // Add any other modules or components used in navbar.component.html
  ],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.css'
})
export class BookingsComponent {

}
