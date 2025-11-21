import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit,ViewChild, ElementRef} from '@angular/core';
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';
import { CourtAdapter } from '../../adapters/court.adapter';
import { Pitch } from '../../models/setupModels';
@Component({
  selector: 'app-court-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './court-list.component.html',
  styleUrl: './court-list.component.css'
})
export class CourtListComponent implements OnInit {
   @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  allCourts: any[] = [];       // All courts fetched from API
  courts: any[] = [];          // Filtered courts

  @Input() noCourtsMessage = '';
  @Input() currentPage = 1;
  @Input() pageSize = 5; 

  /* @Output() pageChange = new EventEmitter<number>(); */
  @Output() courtClick = new EventEmitter<any>();
 showLeftArrow = false;
  showRightArrow = true;
  constructor(private dataService: GetDatabyDatasourceService) {}

  ngOnInit() {
    this.loadCourts();
  }
  
   ngAfterViewInit() {
    setTimeout(() => this.updateArrows(), 200);
  }

  loadCourts() {
    // Use dataSourceId = 1 (assuming 1 = courts)
    this.dataService.getData(1,'').subscribe({
      next: (data: any[]) => {
        const adapter = new CourtAdapter();
        const apiData = Array.isArray(data) ? data : [];
        this.allCourts = apiData.map(item => adapter.fromApi(item));
        this.courts = [...this.allCourts];
      },
      
      error: (err) => {
        this.allCourts = [];
        this.courts = [];
      }
    });
  }

  // ---------------------------
  // COMPREHENSIVE FILTER LOGIC
  // ---------------------------
  filterCourts(searchText: string, filters?: any) {
    if (!filters) filters = {};

    const text = (searchText || '').toLowerCase().trim();

    this.courts = this.allCourts.filter(court => {
      // ---------- REAL-TIME SEARCH ON ALL FIELDS ----------
      let matchesText = true;
      if (text) {
        const searchFields = [
          court.name || '',
          court.location || '',
          court.about || '',
          ...(court.offers || []),
          ...(court.pitches?.map((p: Pitch) => p.pitchtype) || []),
          court.rating?.toString() || ''
        ];
        
        matchesText = searchFields.some(field => 
          field.toLowerCase().includes(text)
        );
      }

      // ---------- LOCATION FILTER ----------
      let matchesLocation = true;
      if (filters.location && filters.location.trim()) {
        const locationFilter = filters.location.toLowerCase().trim();
        matchesLocation = (court.location || '').toLowerCase().includes(locationFilter);
      }

      // ---------- DATE FILTER ----------
      let matchesDate = true;
      if (filters.selectedDate) {
        const selectedDate = new Date(filters.selectedDate);
        const dateStr = selectedDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        
        // Check if court has booked slots for this date
        // If date is selected, court should be available (not fully booked)
        if (court.bookedSlots && court.bookedSlots[dateStr]) {
          // Court has some bookings on this date, but might still have available slots
          // We'll consider it available if it has pitches (can check availability later)
          matchesDate = true;
        } else {
          // No bookings on this date, court is available
          matchesDate = true;
        }
      }

      // ---------- TIME FILTER ----------
      let matchesTime = true;
      if (filters.selectedTime && filters.selectedDate) {
        const selectedDate = new Date(filters.selectedDate);
        const dateStr = selectedDate.toISOString().split('T')[0];
        const selectedTime = filters.selectedTime;
        
        // Check if the selected time slot is booked
        if (court.bookedSlots && court.bookedSlots[dateStr]) {
          const bookedTimes = court.bookedSlots[dateStr];
          // Check if selected time conflicts with booked slots
          // This is a simple check - you might want to enhance this based on duration
          matchesTime = !bookedTimes.includes(selectedTime);
        } else {
          // No bookings, time is available
          matchesTime = true;
        }
        
        // Also check if time is within court operating hours
        if (matchesTime && court.openingTime && court.closingTime) {
          const timeMatch = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const period = timeMatch[3].toUpperCase();
            
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            
            const selectedMinutes = hours * 60 + minutes;
            matchesTime = selectedMinutes >= court.openingMinutes && 
                         selectedMinutes <= court.closingMinutes;
          }
        }
      }

      // ---------- MATCH DURATION FILTER ----------
      let matchesDuration = true;
      if (filters.matchDuration) {
        // Check if court has pitches that can accommodate the duration
        // For now, we'll just check if court has any pitches
        // You can enhance this to check specific pitch availability
        matchesDuration = court.pitches && court.pitches.length > 0;
      }

      // ---------- PITCH SIZES FILTER ----------
      let matchesPitch = true;
      if (filters.selectedPitchSizes?.length) {
        matchesPitch = filters.selectedPitchSizes.some((size: string) =>
          court.pitches?.some((p: Pitch) => p.pitchtype === size)
        );
      }

      return matchesText && matchesLocation && matchesDate && matchesTime && matchesDuration && matchesPitch;
    });
    
    // Update scroll arrows after filtering
    setTimeout(() => this.updateArrows(), 100);
  }

   get visibleCourts() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.courts.slice(start, start + this.pageSize);
  } 
scrollLeft() {
    const el = this.scrollContainer.nativeElement;
    el.scrollBy({ left: -350, behavior: 'smooth' });
  }

  scrollRight() {
    const el = this.scrollContainer.nativeElement;
    el.scrollBy({ left: 350, behavior: 'smooth' });
  }

  onScroll() {
    this.updateArrows();
  }

  updateArrows() {
    if (!this.scrollContainer) return;

    const el = this.scrollContainer.nativeElement;

    this.showLeftArrow = el.scrollLeft > 20;
    this.showRightArrow = el.scrollLeft + el.clientWidth < el.scrollWidth - 20;
  }
  /* nextPage() {
    this.pageChange.emit(this.currentPage + 1);
  }

  prevPage() {
    this.pageChange.emit(this.currentPage - 1);
  }

  hasNextPage(): boolean {
    return this.currentPage * this.pageSize < this.courts.length;
  }
 */
  openCourt(court: any) {
    this.courtClick.emit(court);
  }
}
