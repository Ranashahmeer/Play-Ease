import { CommonModule } from '@angular/common';
import { Component, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { SearchbarComponent } from '../searchbar/searchbar.component';
import { FilterDrawerComponent } from '../filter-drawer/filter-drawer.component';
import { CourtListComponent } from '../court-list/court-list.component';
import { BookingRecordsComponent } from '../booking-records/booking-records.component';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SearchbarComponent,
    FilterDrawerComponent,
    CourtListComponent,
    BookingRecordsComponent
  ],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css']
})
export class BookingsComponent implements AfterViewInit, OnDestroy {

    form: FormGroup;
  filtersOpened = false;
  filtersCollapsed = false; // New state for collapsed filter box

  @ViewChild('courtListRef') courtListRef!: CourtListComponent;
  
  private destroy$ = new Subject<void>();

  timeOptionsSidebar = [
    { text: '08:00 AM' }, { text: '10:00 AM' }, { text: '12:00 PM' },
    { text: '02:00 PM' }, { text: '04:00 PM' }, { text: '06:00 PM' }
  ];
  minDate = new Date();

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({
      searchQuery: [''],
      selectedDate: [null],
      selectedTime: [null],
      matchDuration: [null],
      selectedPitchSizes: [[]],
      location: ['']
    });
  }

  ngAfterViewInit() {
    // Ensure ViewChild is initialized
    setTimeout(() => {
      if (this.courtListRef) {
        // Initial load - show all courts
        this.courtListRef.filterCourts('', {});
      }
      
      // Set up real-time filter application
      this.setupRealtimeFilters();
    }, 100);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupRealtimeFilters() {
    // Apply filters in real-time when form values change (with debounce)
    // Skip searchQuery changes as they're handled separately
    this.form.valueChanges
      .pipe(
        debounceTime(300), // Wait 300ms after user stops changing filters
        distinctUntilChanged((prev, curr) => {
          // Only trigger if filter values actually changed (not search query)
          return JSON.stringify({
            selectedDate: prev.selectedDate,
            selectedTime: prev.selectedTime,
            matchDuration: prev.matchDuration,
            selectedPitchSizes: prev.selectedPitchSizes,
            location: prev.location
          }) === JSON.stringify({
            selectedDate: curr.selectedDate,
            selectedTime: curr.selectedTime,
            matchDuration: curr.matchDuration,
            selectedPitchSizes: curr.selectedPitchSizes,
            location: curr.location
          });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Apply filters in real-time when drawer is open or collapsed
        if (this.courtListRef) {
          this.applyFiltersRealtime();
        }
      });
  }

  applyFiltersRealtime() {
    if (!this.courtListRef) return;
    
    const formValue = this.form.value;
    
    // Prepare filter object
    const filterValues: any = {
      selectedDate: formValue.selectedDate || null,
      selectedTime: formValue.selectedTime || null,
      matchDuration: formValue.matchDuration || null,
      selectedPitchSizes: Array.isArray(formValue.selectedPitchSizes) ? formValue.selectedPitchSizes : [],
      location: (formValue.location || '').trim()
    };
    
    // Convert date to string format if needed
    if (filterValues.selectedDate instanceof Date) {
      filterValues.selectedDate = filterValues.selectedDate.toISOString().split('T')[0];
    } else if (filterValues.selectedDate && typeof filterValues.selectedDate === 'string') {
      filterValues.selectedDate = filterValues.selectedDate.split('T')[0];
    }
    
    const searchQuery = (formValue.searchQuery || '').trim();
    
    // Apply filters
    this.courtListRef.filterCourts(searchQuery, filterValues);
  }

  onSearch(searchTerm: string) {
    // Real-time search - filter with current form values
    if (this.courtListRef) {
      this.courtListRef.filterCourts(searchTerm || '', this.form.value);
    }
  }
  
  toggleFilters() {
    this.filtersOpened = !this.filtersOpened;
  }

  onApplyFilters() {
    // Collapse the drawer to small box instead of closing
    this.filtersOpened = false;
    this.filtersCollapsed = true;
    
    // Apply filters immediately
    setTimeout(() => {
      this.applyFiltersRealtime();
    }, 50);
  }

  expandFilters() {
    // Expand the collapsed filter box back to full drawer
    this.filtersCollapsed = false;
    this.filtersOpened = true;
  }

  closeFilters() {
    // Completely close filters (both drawer and collapsed box)
    this.filtersOpened = false;
    this.filtersCollapsed = false;
  }

  getActiveFiltersCount(): number {
    const formValue = this.form.value;
    let count = 0;
    
    if (formValue.selectedDate) count++;
    if (formValue.selectedTime) count++;
    if (formValue.matchDuration) count++;
    if (formValue.selectedPitchSizes && formValue.selectedPitchSizes.length > 0) count++;
    if (formValue.location && formValue.location.trim()) count++;
    
    return count;
  }

  getActiveFiltersSummary(): string[] {
    const formValue = this.form.value;
    const summary: string[] = [];
    
    if (formValue.selectedDate) {
      const date = new Date(formValue.selectedDate);
      summary.push(`Date: ${date.toLocaleDateString()}`);
    }
    if (formValue.selectedTime) {
      summary.push(`Time: ${formValue.selectedTime}`);
    }
    if (formValue.matchDuration) {
      summary.push(`Duration: ${formValue.matchDuration} mins`);
    }
    if (formValue.selectedPitchSizes && formValue.selectedPitchSizes.length > 0) {
      summary.push(`Pitch: ${formValue.selectedPitchSizes.join(', ')}`);
    }
    if (formValue.location && formValue.location.trim()) {
      summary.push(`Location: ${formValue.location}`);
    }
    
    return summary;
  }

  onClearFilters() {
    // Reset form to default values (keep searchQuery)
    const currentSearch = this.form.value.searchQuery || '';
    
    this.form.patchValue({
      selectedDate: null,
      selectedTime: null,
      matchDuration: null,
      selectedPitchSizes: [],
      location: ''
    });
    
    // Clear filters and show all courts (keep search query if any)
    if (this.courtListRef) {
      this.courtListRef.filterCourts(currentSearch, {});
    }
    
    // Close collapsed box if no filters
    if (this.getActiveFiltersCount() === 0) {
      this.filtersCollapsed = false;
    }
  }

  onTimeSelect(item: any) {
    this.form.patchValue({ selectedTime: item });
  }

  openCourtDetails(court: any) {
    this.router.navigate(['/court-booking', court.courtId]);
  }
  
}
