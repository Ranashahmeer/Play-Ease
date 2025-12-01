import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, ViewChild, ElementRef} from '@angular/core';
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
export class CourtListComponent implements OnInit, AfterViewInit {
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
        this.allCourts = this.allCourts.map(court => ({
          ...court,
          minPrice: court.pitches?.length
            ? court.pitches[0].price   // first pitch price
            : 0
        }));
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
        // Handle both Date objects and string dates (YYYY-MM-DD format)
        let dateStr: string = '';
        if (filters.selectedDate instanceof Date) {
          dateStr = filters.selectedDate.toISOString().split('T')[0];
        } else if (typeof filters.selectedDate === 'string') {
          // If it's already a string in YYYY-MM-DD format, use it directly
          dateStr = filters.selectedDate.split('T')[0];
        } else {
          // Try to parse it as a date
          const selectedDate = new Date(filters.selectedDate);
          if (isNaN(selectedDate.getTime())) {
            matchesDate = false; // Invalid date
            dateStr = '';
          } else {
            dateStr = selectedDate.toISOString().split('T')[0];
          }
        }
        
        // If we have a valid date string, check availability
        if (matchesDate && dateStr) {
          // Check if court has pitches (basic availability check)
          // If court has no pitches, it's not available
          if (!court.pitches || court.pitches.length === 0) {
            matchesDate = false;
          } else {
            // Court has pitches, so it's available for booking
            // Additional check: if court has bookedSlots data, we could check if fully booked
            // For now, we consider it available if it has pitches
            matchesDate = true;
          }
        }
      }

      // ---------- TIME FILTER ----------
      let matchesTime = true;
      if (filters.selectedTime) {
        const selectedTime = filters.selectedTime;
        
        // Check if time is within court operating hours
        if (court.openingTime && court.closingTime && court.openingMinutes !== undefined && court.closingMinutes !== undefined) {
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
          } else {
            // Invalid time format
            matchesTime = false;
          }
        }
        
        // If date is also selected, check for booked slots
        if (matchesTime && filters.selectedDate) {
          let dateStr: string = '';
          if (filters.selectedDate instanceof Date) {
            dateStr = filters.selectedDate.toISOString().split('T')[0];
          } else if (typeof filters.selectedDate === 'string') {
            dateStr = filters.selectedDate.split('T')[0];
          } else {
            const selectedDate = new Date(filters.selectedDate);
            if (!isNaN(selectedDate.getTime())) {
              dateStr = selectedDate.toISOString().split('T')[0];
            }
          }
          
          // Check if the selected time slot is booked
          if (court.bookedSlots && court.bookedSlots[dateStr]) {
            const bookedTimes = court.bookedSlots[dateStr];
            // Check if selected time conflicts with booked slots
            // Handle both array and single value
            const bookedTimesArray = Array.isArray(bookedTimes) ? bookedTimes : [bookedTimes];
            matchesTime = !bookedTimesArray.includes(selectedTime);
          }
        }
      }

      // ---------- MATCH DURATION FILTER ----------
      let matchesDuration = true;
      if (filters.matchDuration) {
        // Check if court has pitches that can accommodate the duration
        // For now, we check if court has any pitches (basic check)
        // In a real scenario, you might check if the duration fits within available time slots
        matchesDuration = court.pitches && court.pitches.length > 0;
        
        // Additional check: if court has operating hours, ensure duration fits
        if (matchesDuration && court.openingMinutes !== undefined && court.closingMinutes !== undefined) {
          const totalAvailableMinutes = court.closingMinutes - court.openingMinutes;
          matchesDuration = totalAvailableMinutes >= filters.matchDuration;
        }
      }

      // ---------- PITCH SIZES FILTER ----------
      let matchesPitch = true;
      if (filters.selectedPitchSizes && Array.isArray(filters.selectedPitchSizes) && filters.selectedPitchSizes.length > 0) {
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
