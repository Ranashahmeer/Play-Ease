import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DxDateBoxModule, DxButtonModule, DxTagBoxModule, DxSliderModule } from 'devextreme-angular';

interface Court {
  name: string;
  location: string;
  rating: number;
  pitches: string[];
  price: number;
  ladiesDay?: string;
  image: string;
}

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DxDateBoxModule,
    DxButtonModule,
    DxTagBoxModule,
    DxSliderModule,
  ],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.css',
})
export class BookingsComponent implements OnInit {
  selectedDate: Date = new Date();
  selectedTime: string = '';
  selectedPitchSizes: string[] = [];
  distance: number = 25;
  searchQuery: string = '';
  matchDuration: number = 60;

  currentPage: number = 1;
  pageSize: number = 4;

  allCourts: Court[] = [
    {
      name: 'Alpha Arena',
      location: 'Gulberg',
      rating: 4.5,
      pitches: ['5x5', '6x6'],
      price: 2000,
      ladiesDay: 'Monday',
      image: 'assets/alphaarena.jpg',
    },
    {
      name: 'Beta Grounds',
      location: 'DHA',
      rating: 4.2,
      pitches: ['7x7', '11x11'],
      price: 1800,
      image: 'assets/betagrounds.jpg',
    },
    {
      name: 'Gamma Pitch',
      location: 'Johar',
      rating: 4.0,
      pitches: ['5x5'],
      price: 2200,
      ladiesDay: 'Wednesday',
      image: 'assets/gammapitch.jpg',
    },
    {
      name: 'Delta Field',
      location: 'PECHS',
      rating: 4.3,
      pitches: ['6x6', '9x9'],
      price: 2100,
      image: 'assets/deltafields.jpg',
    },
    {
      name: 'Omega Turf',
      location: 'Nazimabad',
      rating: 4.6,
      pitches: ['5x5'],
      price: 1900,
      image: 'assets/padel-omegaturf.jpg',
    },
  ];

  visibleCourts: Court[] = [];
  manualFilteredCourts: Court[] = [];

  ngOnInit(): void {
    this.manualFilteredCourts = [...this.allCourts];
    this.updateVisibleCourts();
  }

  get filteredCourts(): Court[] {
    return this.allCourts.filter(court => {
      const matchesSearch = court.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesPitch =
        this.selectedPitchSizes.length === 0 ||
        this.selectedPitchSizes.some(p => court.pitches.includes(p));
      return matchesSearch && matchesPitch;
    });
  }

  updateVisibleCourts(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.visibleCourts = this.manualFilteredCourts.slice(start, end);
  }

  nextPage(): void {
    const totalPages = Math.ceil(this.manualFilteredCourts.length / this.pageSize);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.updateVisibleCourts();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateVisibleCourts();
    }
  }

  hasNextPage(): boolean {
    return this.currentPage < Math.ceil(this.manualFilteredCourts.length / this.pageSize);
  }

  setDuration(minutes: number): void {
    this.matchDuration = minutes;
  }

  useCurrentLocation(): void {
    alert('Using current location...');
  }

  openCourtDetails(court: Court): void {
    console.log('Court clicked:', court);
    alert(`Opening details for: ${court.name}`);
  }

  applyFilters(): void {
    this.manualFilteredCourts = this.allCourts.filter(court => {
      const matchesSearch = court.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesPitch =
        this.selectedPitchSizes.length === 0 ||
        this.selectedPitchSizes.some(p => court.pitches.includes(p));
      return matchesSearch && matchesPitch;
    });

    this.currentPage = 1;
    this.updateVisibleCourts();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedPitchSizes = [];
    this.selectedDate = new Date();
    this.selectedTime = '';
    this.matchDuration = 60;
    this.distance = 25;

    this.manualFilteredCourts = [...this.allCourts];
    this.currentPage = 1;
    this.updateVisibleCourts();
  }
}
