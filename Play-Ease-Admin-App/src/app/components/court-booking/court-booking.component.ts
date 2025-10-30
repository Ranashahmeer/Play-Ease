import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { DxButtonModule } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';
import { CourtAdapter } from '../../adapters/court.adapter';
import { Court } from '../../models/setupModels';

@Component({
  selector: 'app-court-booking',
  standalone: true,
  imports: [CommonModule, DxButtonModule],
  templateUrl: './court-booking.component.html',
  styleUrl: './court-booking.component.css'
})
export class CourtListComponent implements OnInit {
  @Output() courtsLoaded = new EventEmitter<Court[]>();
  @Output() courtSelected = new EventEmitter<Court>();
  
  courts: Court[] = [];
  bookings: any[] = [];
  visibleCourts: Court[] = [];
  manualFilteredCourts: Court[] = [];
  noCourtsMessage = '';
  
  currentPage = 1;
  pageSize = 4;

  constructor(private GetDatabyDatasourceService: GetDatabyDatasourceService) {}

  ngOnInit(): void {
    this.getCourtData();
  }

  getCourtData(): void {
    this.GetDatabyDatasourceService.getData(1).subscribe({
      next: (data: any[] | null | undefined) => {
        const courtAdapter = new CourtAdapter();
        const apiData = Array.isArray(data) ? data : [];
        this.courts = apiData.map(item => courtAdapter.fromApi(item));
        this.bookings = [...this.courts];
        this.manualFilteredCourts = [...this.courts];
        this.updateVisibleCourts();
        
        console.log('Mapped Courts:', this.courts);
        this.courtsLoaded.emit(this.courts);
      },
      error: (err) => {
        console.error('Error fetching courts:', err);
        this.courts = [];
        this.bookings = [];
        this.manualFilteredCourts = [];
        this.updateVisibleCourts();
      }
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

  onCourtClick(court: Court): void {
    this.courtSelected.emit(court);
  }

  setFilteredCourts(filtered: Court[]): void {
    this.manualFilteredCourts = filtered;
    this.currentPage = 1;
    this.updateVisibleCourts();
  }

  setNoCourtsMessage(message: string): void {
    this.noCourtsMessage = message;
  }

  getCourtMinPrice(court: Court | null): number {
    if (!court || !court.pitches.length) return 0;
    const prices = court.pitches.map(p => p.price);
    return Math.min(...prices);
  }
}