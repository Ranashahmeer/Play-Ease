import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
export class BookingsComponent {

    form: FormGroup;
  filtersOpened = false;

  @ViewChild('courtListRef') courtListRef!: CourtListComponent;

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
      distance: [0]
    });
  }

  onSearch(searchTerm: string) {
    this.courtListRef.filterCourts(searchTerm);
  }
  ngAfterViewInit() {
    console.log("courtListRef loaded:", this.courtListRef);
  } 
  toggleFilters() {
    this.filtersOpened = !this.filtersOpened;
  }

  onApplyFilters() {
    console.log('Filters applied', this.form.value);
    this.filtersOpened = false;
    // You can add additional filtering logic here for courtListRef
    this.courtListRef.filterCourts(
    this.form.value.searchQuery,
    this.form.value
  );
  }

  onClearFilters() {
    this.form.reset({
      searchQuery: '',
      selectedDate: null,
      selectedTime: null,
      matchDuration: null,
      selectedPitchSizes: [],
      distance: 0
    });
    console.log('Filters cleared');
  }

  onUseLocation() {
    console.log('Use current location');
  }

  onTimeSelect(item: any) {
    this.form.patchValue({ selectedTime: item });
    console.log('Time selected', item);
  }

  openCourtDetails(court: any) {
    this.router.navigate(['/court-booking', court.courtId]);
  }
  
}
