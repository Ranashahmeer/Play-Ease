import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DxDateBoxModule, DxButtonModule, DxGalleryModule, DxFileUploaderModule, DxListModule, DxTagBoxModule, DxSliderModule, DxDropDownBoxModule, DxPopupModule, DxCalendarComponent } from 'devextreme-angular';
import { CourtListComponent } from '../court-list/court-list.component';
import { PaymentPopupComponent } from "../payment-popup/payment-popup.component";
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';
import { CourtAdapter } from '../../adapters/court.adapter';
import { SaveBookings } from '../../models/setupModels';
import { AlertService } from '../../services/alert.service';
import { BlockedSlotsService } from '../../services/blocked-slots.service';
import { SaveBookingsService } from '../../services/bookings/save-bookings.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-court-booking',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DxDateBoxModule, DxButtonModule, DxListModule, DxTagBoxModule, DxSliderModule, DxGalleryModule, DxFileUploaderModule, DxPopupModule, DxDropDownBoxModule,
    CourtListComponent, PaymentPopupComponent, DxCalendarComponent
  ],
  templateUrl: './court-booking.component.html',
  styleUrl: './court-booking.component.css'
})
export class CourtBookingComponent implements OnInit, OnDestroy {
  form: FormGroup;
  courtId!: number;
  courtDetails: any = null;
  selectedPitchSize: string = '';
  selectedBookingDate: Date = new Date();
  selectedTimeSlots: string[] = [];
  timeSlotItems: any[] = [];
  bookedForDay: string[] = [];
  bookedSlotsFromAPI: any[] = [];
  blockedSlotsFromAPI: any[] = [];
  allSlotsDisabled = false;
  paymentPopupVisible: boolean = false;
  minDate: Date = new Date();
  currentUserId: number = 0;
  bookingData!: SaveBookings;
  ownerPaymentMethods: any[] = [];
  isLoadingBookedSlots: boolean = false;
  private bookingCancelledSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private dataService: GetDatabyDatasourceService,
    private router: Router,
    private alertService: AlertService,
    private blockedSlotsService: BlockedSlotsService,
    private saveBookingsService: SaveBookingsService
  ) {
    this.form = this.fb.group({
      matchDuration: [60],
      selectedPitchSizes: [[]],
      searchQuery: ['']
    });
  }

  ngOnInit(): void {
    this.currentUserId = Number(localStorage.getItem('userId')) || 0;
    if (!this.currentUserId) {
      this.alertService.warning('Please login first!');
      this.router.navigate(['/login']);
      return;
    }
    this.courtId = +this.route.snapshot.paramMap.get('courtId')!;
    this.fetchCourtDetails();
    
    // Subscribe to booking cancellation events to refresh slots
    this.bookingCancelledSubscription = this.saveBookingsService.bookingCancelled$.subscribe((bookingId: number) => {
      // Refresh slots for the currently selected date
      if (this.selectedBookingDate) {
        this.fetchBookedSlotsForDate(this.selectedBookingDate);
      }
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    this.bookingCancelledSubscription?.unsubscribe();
  }

  fetchCourtDetails(): void {
    this.dataService.getData(1, `c.CourtID = ${this.courtId}`).subscribe({
      next: (data: any[]) => {
        const adapter = new CourtAdapter();
        const apiData = Array.isArray(data) ? data : [];
        this.courtDetails = apiData.length > 0 ? adapter.fromApi(apiData[0]) : null;
        if (this.courtDetails) {
          this.fetchOwnerPaymentMethods(this.courtDetails.OwnerId);
          this.fetchBookedSlotsForDate(this.selectedBookingDate);
        } else {
          console.warn('Court not found for ID:', this.courtId);
        }
      },
      error: (err: any) => {
        console.error('Error loading courts:', err);
        this.alertService.error('Failed to load court details. Please try again.');
      }
    });
  }

  fetchOwnerPaymentMethods(ownerId: number): void {
    if (!ownerId || ownerId <= 0) return;
    this.dataService.getData(21, `cop.OwnerID = ${ownerId}`).subscribe({
      next: (data: any[]) => {
        this.ownerPaymentMethods = Array.isArray(data) ? data : [];
      },
      error: (err: any) => console.error('Error loading payment methods:', err)
    });
  }

  selectPitch(pitch: any): void {
    this.selectedPitchSize = pitch.pitchtype;
  }

  onBookingDateChanged(e: any): void {
    this.selectedBookingDate = e.value;
    this.fetchBookedSlotsForDate(this.selectedBookingDate);
  }

  fetchBookedSlotsForDate(date: Date): void {
    if (!this.courtId || !date) return;
    this.isLoadingBookedSlots = true;
    const dateKey = this.toKey(date);
    const whereClause = `b.CourtID = ${this.courtId} AND CAST(b.BookingDate AS DATE) = '${dateKey}' AND b.IsActive = 1`;
    
    // Fetch booked slots
    this.dataService.getData(22, whereClause).subscribe({
      next: (data: any[]) => {
        this.bookedSlotsFromAPI = Array.isArray(data) ? data : [];
        this.bookedForDay = this.bookedSlotsFromAPI
          .map(b => this.convertTimeSpanTo12Hour(b.starttime || b.StartTime))
          .filter(t => t)
          .sort();
        this.fetchBlockedSlotsForDate(date);
      },
      error: (err: any) => {
        console.error('Error fetching booked slots:', err);
        this.bookedSlotsFromAPI = [];
        this.bookedForDay = [];
        this.fetchBlockedSlotsForDate(date);
      }
    });
  }

  fetchBlockedSlotsForDate(date: Date): void {
    if (!this.courtId || !date) {
      this.recomputeAvailability();
      this.isLoadingBookedSlots = false;
      return;
    }

    const dateKey = this.toKey(date);
    this.blockedSlotsService.getBlockedSlotsByCourtAndDate(this.courtId, dateKey).subscribe({
      next: (data: any[]) => {
        this.blockedSlotsFromAPI = Array.isArray(data) ? data : [];
        this.recomputeAvailability();
        this.isLoadingBookedSlots = false;
      },
      error: (err: any) => {
        console.error('Error fetching blocked slots:', err);
        this.blockedSlotsFromAPI = [];
        this.recomputeAvailability();
        this.isLoadingBookedSlots = false;
      }
    });
  }

  toggleTimeSlot(slot: any): void {
    if (slot.disabled) {
      this.alertService.warning((this.isPastSlot(this.timeStringToMinutes(slot.text), this.selectedBookingDate) 
        ? 'This time slot is in the past' 
        : 'This time slot is already booked') + '. Please select another time slot.');
      return;
    }
    
    const index = this.selectedTimeSlots.indexOf(slot.text);
    if (index > -1) {
      this.selectedTimeSlots.splice(index, 1);
    } else {
      const currentSlot = this.timeSlotItems.find(s => s.text === slot.text);
      if (currentSlot?.disabled) {
        this.alertService.warning('This time slot has just been booked. Please select another time slot.');
        this.recomputeAvailability();
        return;
      }
      
      const duration = Number(this.form.get('matchDuration')?.value) || 60;
      const slotMin = this.timeStringToMinutes(slot.text);
      const hasConflict = this.selectedTimeSlots.some(selected => {
        const selectedMin = this.timeStringToMinutes(selected);
        return this.intervalsOverlap(slotMin, duration, selectedMin, duration);
      });
      
      if (hasConflict) {
        this.alertService.warning('This time slot overlaps with a previously selected slot. Please select non-overlapping slots.');
        return;
      }
      
      this.selectedTimeSlots.push(slot.text);
      this.selectedTimeSlots.sort((a, b) => this.timeStringToMinutes(a) - this.timeStringToMinutes(b));
    }
  }

  recomputeAvailability(): void {
    if (!this.courtDetails) return;

    const duration = Number(this.form.get('matchDuration')?.value) || 60;
    const openMin = this.timeStringToMinutes(this.courtDetails.openingTime);
    const closeMin = this.timeStringToMinutes(this.courtDetails.closingTime);
    const generatedSlots = this.generateSlots(openMin, closeMin, duration, duration);

    this.timeSlotItems = generatedSlots.map(slot => {
      const slotMin = this.timeStringToMinutes(slot);
      
      // Check overlap with booked slots
      const overlapsBooked = this.bookedSlotsFromAPI.some(booking => {
        const startTime = booking.starttime || booking.StartTime;
        const endTime = booking.endtime || booking.EndTime;
        if (!startTime || !endTime) return false;
        const bookingStartMin = this.timeSpanToMinutes(startTime);
        const bookingEndMin = this.timeSpanToMinutes(endTime);
        return this.intervalsOverlap(slotMin, duration, bookingStartMin, bookingEndMin - bookingStartMin);
      });

      // Check overlap with blocked slots
      const overlapsBlocked = this.blockedSlotsFromAPI.some(blocked => {
        const startTime = blocked.startTime || blocked.starttime;
        const endTime = blocked.endTime || blocked.endtime;
        if (!startTime || !endTime) return false;
        const blockedStartMin = this.timeSpanToMinutes(startTime);
        const blockedEndMin = this.timeSpanToMinutes(endTime);
        return this.intervalsOverlap(slotMin, duration, blockedStartMin, blockedEndMin - blockedStartMin);
      });

      const isPast = this.isPastSlot(slotMin, this.selectedBookingDate);
      return { text: slot, disabled: overlapsBooked || overlapsBlocked || isPast };
    });

    this.selectedTimeSlots = this.selectedTimeSlots.filter(slotText => {
      const slot = this.timeSlotItems.find(i => i.text === slotText);
      return slot && !slot.disabled;
    });

    this.allSlotsDisabled = this.timeSlotItems.every(i => i.disabled);
  }

  getComputedPrice(): number {
    if (!this.courtDetails) return 0;
    const duration = Number(this.form.get('matchDuration')?.value) || 60;
    const basePrice = this.selectedPitchSize
      ? this.courtDetails.pitches.find((p: any) => p.pitchtype === this.selectedPitchSize)?.price
      : Math.min(...this.courtDetails.pitches.map((p: any) => p.price));
    const slotCount = this.selectedTimeSlots.length || 0;
    return Math.round(basePrice * (duration / 60) * slotCount);
  }

  proceedToPayment(): void {
    const errors: string[] = [];
    if (!this.selectedPitchSize) errors.push('Please select a pitch size');
    if (this.selectedTimeSlots.length === 0) errors.push('Please select at least one booking time slot');
    if (!this.selectedBookingDate) errors.push('Please select a booking date');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(this.selectedBookingDate);
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate < today) errors.push('Cannot book for a past date');
    if (!this.courtDetails) errors.push('Court details not loaded. Please refresh the page.');
    if (!this.currentUserId || this.currentUserId <= 0) {
      errors.push('User session expired. Please login again.');
      this.router.navigate(['/login']);
      return;
    }

    if (errors.length > 0) {
      this.alertService.error('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }

    const selectedPitch = this.courtDetails.pitches.find((p: any) => p.pitchtype === this.selectedPitchSize);
    if (!selectedPitch?.pitchId || selectedPitch.pitchId <= 0) {
      this.alertService.error('Invalid pitch selection!');
      return;
    }

    this.recomputeAvailability();
    if (this.selectedTimeSlots.length === 0) {
      this.alertService.warning('Please select at least one time slot');
      return;
    }

    const duration = Number(this.form.get('matchDuration')?.value) || 60;
    const unavailableSlots: string[] = [];
    
    for (const slot of this.selectedTimeSlots) {
      const slotItem = this.timeSlotItems.find(s => s.text === slot);
      if (!slotItem || slotItem.disabled) {
        unavailableSlots.push(slot);
        continue;
      }
      
      const slotMin = this.timeStringToMinutes(slot);
      if (this.isPastSlot(slotMin, this.selectedBookingDate)) {
        unavailableSlots.push(slot);
        continue;
      }
      
      const overlapsBooked = this.bookedSlotsFromAPI.some(booking => {
        const startTime = booking.starttime || booking.StartTime;
        const endTime = booking.endtime || booking.EndTime;
        if (!startTime || !endTime) return false;
        const bookingStartMin = this.timeSpanToMinutes(startTime);
        const bookingEndMin = this.timeSpanToMinutes(endTime);
        return this.intervalsOverlap(slotMin, duration, bookingStartMin, bookingEndMin - bookingStartMin);
      });

      const overlapsBlocked = this.blockedSlotsFromAPI.some(blocked => {
        const startTime = blocked.startTime || blocked.starttime;
        const endTime = blocked.endTime || blocked.endtime;
        if (!startTime || !endTime) return false;
        const blockedStartMin = this.timeSpanToMinutes(startTime);
        const blockedEndMin = this.timeSpanToMinutes(endTime);
        return this.intervalsOverlap(slotMin, duration, blockedStartMin, blockedEndMin - blockedStartMin);
      });
      
      if (overlapsBooked || overlapsBlocked) unavailableSlots.push(slot);
    }
    
    if (unavailableSlots.length > 0) {
      this.selectedTimeSlots = this.selectedTimeSlots.filter(s => !unavailableSlots.includes(s));
      this.alertService.warning(`The following time slot(s) are no longer available and have been removed:\n${unavailableSlots.join(', ')}\n\nPlease select different time slots.`);
      this.recomputeAvailability();
      if (this.selectedTimeSlots.length === 0) return;
    }

    const firstSlot = this.selectedTimeSlots[0];
    const startMinutes = this.timeStringToMinutes(firstSlot);
    const endTime = this.minutesToTimeString(startMinutes + duration);

    this.bookingData = {
      CourtId: this.courtId,
      userId: this.currentUserId,
      courtPitchId: selectedPitch.pitchId,
      ownerId: this.courtDetails.OwnerId,
      paymentMethodId: 0,
      paymentProof: '',
      bookingDate: this.toKey(this.selectedBookingDate),
      startTime: firstSlot,
      endTime: endTime,
      price: this.getComputedPrice(),
      selectedSlots: this.selectedTimeSlots
    } as any;

    if (!this.bookingData.CourtId || !this.bookingData.userId || !this.bookingData.courtPitchId || !this.bookingData.ownerId || this.bookingData.price <= 0) {
      this.alertService.error('Invalid booking data. Please try again.');
      return;
    }

    this.paymentPopupVisible = true;
  }

  private toKey(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  private timeStringToMinutes(t: string): number {
    if (!t) return 0;
    const [timePart, ampm] = t.split(' ');
    const [hh, mm] = timePart.split(':').map(Number);
    let hours = hh;
    if (ampm?.toUpperCase() === 'PM' && hh !== 12) hours += 12;
    if (ampm?.toUpperCase() === 'AM' && hh === 12) hours = 0;
    return hours * 60 + mm;
  }

  private timeSpanToMinutes(timeSpan: string): number {
    if (!timeSpan) return 0;
    const parts = timeSpan.split(':');
    if (parts.length < 2) return 0;
    const [hours, minutes] = parts.map(Number);
    return isNaN(hours) || isNaN(minutes) ? 0 : hours * 60 + minutes;
  }

  private convertTimeSpanTo12Hour(timeSpan: string): string {
    if (!timeSpan) return '';
    const parts = timeSpan.split(':');
    if (parts.length < 2) return '';
    const [hours, minutes] = parts.map(Number);
    if (isNaN(hours) || isNaN(minutes)) return '';
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
    return `${String(displayHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
  }

  private generateSlots(startMin: number, endMin: number, stepMinutes: number, duration: number): string[] {
    const slots: string[] = [];
    if (stepMinutes <= 0 || duration <= 0) return slots;
    let cur = startMin;
    while (cur + duration <= endMin) {
      slots.push(this.minutesToTimeString(cur));
      cur += stepMinutes;
    }
    return slots;
  }

  private minutesToTimeString(mins: number): string {
    mins = ((mins % 1440) + 1440) % 1440;
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const displayHour = ((hh + 11) % 12) + 1;
    return `${String(displayHour).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`;
  }

  private intervalsOverlap(startA: number, durationA: number, startB: number, durationB: number): boolean {
    return startA < startB + durationB && startB < startA + durationA;
  }

  private isPastSlot(slotMinutes: number, date: Date): boolean {
    const now = new Date();
    const slotDateKey = this.toKey(date);
    const todayKey = this.toKey(now);
    if (slotDateKey !== todayKey) return false;
    return slotMinutes <= now.getHours() * 60 + now.getMinutes();
  }
}
