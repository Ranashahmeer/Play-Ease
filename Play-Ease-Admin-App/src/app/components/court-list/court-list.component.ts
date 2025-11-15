import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';
import { CourtAdapter } from '../../adapters/court.adapter';

@Component({
  selector: 'app-court-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './court-list.component.html',
  styleUrl: './court-list.component.css'
})
export class CourtListComponent implements OnInit {

  allCourts: any[] = [];       // All courts fetched from API
  courts: any[] = [];          // Filtered courts

  @Input() noCourtsMessage = '';
  @Input() currentPage = 1;
  @Input() pageSize = 5;

  @Output() pageChange = new EventEmitter<number>();
  @Output() courtClick = new EventEmitter<any>();

  constructor(private dataService: GetDatabyDatasourceService) {}

  ngOnInit() {
    this.loadCourts();
  }

  loadCourts() {
    // Use dataSourceId = 1 (assuming 1 = courts)
    this.dataService.getData(1).subscribe({
      next: (data: any[]) => {
        const adapter = new CourtAdapter();
        const apiData = Array.isArray(data) ? data : [];
        this.allCourts = apiData.map(item => adapter.fromApi(item));
        this.courts = [...this.allCourts];
      },
      error: (err) => {
        console.error('Error loading courts:', err);
        this.allCourts = [];
        this.courts = [];
      }
    });
  }

  // ---------------------------
  // FILTER LOGIC LIKE BOOKING
  // ---------------------------
filterCourts(searchText: string, filters?: any) {
  if (!filters) filters = {};

  const text = (searchText || '').toLowerCase();

  this.courts = this.allCourts.filter(court => {
    // ---------- SEARCH TEXT ----------
    const matchesText =
      court.name.toLowerCase().includes(text) ||
      court.location.toLowerCase().includes(text);

    // ---------- DATE ----------
    let matchesDate = true;
    if (filters.selectedDate) {
      const selected = new Date(filters.selectedDate).toDateString();
      matchesDate = court.availableDates?.some(
        (d: string | Date) => new Date(d).toDateString() === selected
      );
    }

    // ---------- TIME ----------
    let matchesTime = true;
    if (filters.selectedTime) {
      matchesTime = court.availableTimes?.includes(filters.selectedTime);
    }

    // ---------- MATCH DURATION ----------
    let matchesDuration = true;
    if (filters.matchDuration) {
      matchesDuration = court.matchDurations?.includes(filters.matchDuration);
    }

    // ---------- PITCH SIZES ----------
    let matchesPitch = true;
    if (filters.selectedPitchSizes?.length) {
      matchesPitch = filters.selectedPitchSizes.some((size: string) =>
        court.pitchSizes?.includes(size)
      );
    }

    // ---------- DISTANCE ----------
    let matchesDistance = true;
    if (filters.distance != null && filters.distance > 0) {
      matchesDistance = court.distance <= filters.distance;
    }

    return matchesText && matchesDate && matchesTime && matchesDuration && matchesPitch && matchesDistance;
  });
}

  get visibleCourts() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.courts.slice(start, start + this.pageSize);
  }

  nextPage() {
    this.pageChange.emit(this.currentPage + 1);
  }

  prevPage() {
    this.pageChange.emit(this.currentPage - 1);
  }

  hasNextPage(): boolean {
    return this.currentPage * this.pageSize < this.courts.length;
  }

  openCourt(court: any) {
    this.courtClick.emit(court);
  }
}
