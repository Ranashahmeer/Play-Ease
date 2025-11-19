import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-our-services',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './our-services.component.html',
    styleUrl: './our-services.component.css'
})
export class OurServicesComponent {
  constructor(private router: Router) {}

  navigateToBookings(): void {
    this.router.navigate(['/bookings']);
  }

  navigateToPlayerRecruitment(): void {
    this.router.navigate(['/player-recruitment']);
  }
}
