import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  DxDateBoxModule,
  DxButtonModule,DxGalleryModule,DxFileUploaderModule,DxListModule,
  DxTagBoxModule,
  DxSliderModule,DxDropDownBoxModule,DxPopupModule
} from 'devextreme-angular';
import { Subscription } from 'rxjs';
import {GetDatabyDatasourceService} from '../../services/get-data/get-databy-datasource.service'
import e from 'express';
import { CourtAdapter } from '../../adapters/court.adapter';
import { Court, SaveBookings } from '../../models/setupModels';
import { SaveBookingsService } from '../../services/bookings/save-bookings.service';
import { BookingAdapter } from '../../adapters/booking.adapter';
 
/* ===== Utility used both outside and inside the component ===== */
function toKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
const TODAY_KEY = toKeyLocal(new Date());
@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule,ReactiveFormsModule,DxDateBoxModule,DxButtonModule,DxListModule,DxTagBoxModule,DxSliderModule, DxGalleryModule, DxGalleryModule, DxFileUploaderModule,DxPopupModule,DxDropDownBoxModule
],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.css',
})

export class BookingsComponent implements OnInit {
  form!: FormGroup;
  private subscriptions: Subscription[] = [];

  currentPage = 1;
  pageSize = 4;
  // Popup state
  popupVisible = false;
  selectedCourt: Court | null = null;
  // Booking selections (inside popup)
  selectedBookingDate: Date = new Date();
  selectedBookingTime = '';
  selectedPitchSize = '';

  minDate: Date = new Date();

  bookedForDay: string[] = [];
  timeSlotItems: { text: string; disabled: boolean }[] = [];

  // Sidebar time options (24h)
  timeOptionsSidebar: { text: string; disabled: boolean }[] = [];

  noCourtsMessage = '';

  // Payment review + reservation
  paymentPopupVisible = false;
  paymentProofFile: File | null = null;
  paymentProofPreviewUrl: string | null = null;

  readonly RESERVATION_MINUTES = 15;
  reservationExpiresAt: number | null = null;
  reservationRemaining = '';
  private reservationTimerRef: any = null;
  reservationExpired = false;
  bookings: any[] = [];


  visibleCourts: Court[] = [];
  manualFilteredCourts: Court[] = [];
  // allCourts: Court[] = []; 
  courts: Court[] = []; 
  ownerPaymentMethods: any;

  constructor(private fb: FormBuilder,private saveBookingsService: SaveBookingsService,private GetDatabyDatasourceService: GetDatabyDatasourceService) {}

  ngOnInit(): void {  
    this.form = this.fb.group({
      selectedDate: [new Date()],
      selectedTime: [''],
      matchDuration: [60],
      selectedPitchSizes: [[]],
      distance: [25],
      searchQuery: [''],
    });
    
    this.getCourtData()
  }

getCourtData(){
  this.GetDatabyDatasourceService.getData(1).subscribe({
    next: (data: any[] | null | undefined) => {
      const courtAdapter = new CourtAdapter();
      const apiData = Array.isArray(data) ? data : [];
      this.courts = apiData.map(item => courtAdapter.fromApi(item));
      this.bookings = [...this.courts];
      this.manualFilteredCourts = [...this.courts];
      this.updateVisibleCourts();
  
      console.log('Mapped Courts:', this.courts);
    },
    error: (err) => {
      console.error('Error fetching courts:', err);
      // Fallback so you never break template/loops
      this.courts = [];
      this.bookings = [];
      this.manualFilteredCourts = [];
      this.updateVisibleCourts();
    }
  });
  // React to duration / date changes
  const s1 = this.form.get('matchDuration')!.valueChanges.subscribe(() => {
    if (this.popupVisible) this.recomputeAvailability();
    this.recomputeSidebarTimeOptions();
  });
  const s2 = this.form.get('selectedDate')!.valueChanges.subscribe(() => {
    this.recomputeSidebarTimeOptions();
  });
  this.subscriptions.push(s1, s2);

  this.recomputeSidebarTimeOptions();
    this.recomputeSidebarTimeOptions();
    this.manualFilteredCourts = [...this.courts];
    this.updateVisibleCourts();
}

  /* ========== Pagination & filters ========== */
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
    this.form.get('matchDuration')?.setValue(minutes);
    if (this.popupVisible) this.recomputeAvailability();
    this.recomputeSidebarTimeOptions();
  }

  useCurrentLocation(): void {
    alert('Using current location...');
  }

  applyFilters(): void {
    const { searchQuery, selectedPitchSizes } = this.form.value;
    const selTime = this.form.get('selectedTime')?.value as string;
    const selDate = this.form.get('selectedDate')?.value instanceof Date ? this.form.get('selectedDate')!.value : new Date();
    const duration = Number(this.form.get('matchDuration')?.value) || 60;

    let filtered = this.courts.filter((court) => {
      const matchesSearch = court.name.toLowerCase().includes((searchQuery || '').toLowerCase());
      const matchesPitch =(selectedPitchSizes?.length ?? 0) === 0 ||court.pitches.some((pitch) =>selectedPitchSizes.includes(pitch.pitchtype));
      return matchesSearch && matchesPitch;
    });

    if (selTime) {
      const startMin = this.timeStringToMinutes(selTime);
      filtered = filtered.filter(court => this.isCourtAvailableAt(court, selDate, startMin, duration));
      if (filtered.length === 0) {
        this.manualFilteredCourts = [];
        this.noCourtsMessage = 'No courts available for selected time and duration.';
        this.currentPage = 1;
        this.updateVisibleCourts();
        return;
      }
    }

    this.noCourtsMessage = '';
    this.manualFilteredCourts = filtered;
    this.currentPage = 1;
    this.updateVisibleCourts();
  }

  clearFilters(): void {
    this.form.reset({
      selectedDate: new Date(),
      selectedTime: '',
      matchDuration: 60,
      selectedPitchSizes: [],
      distance: 25,
      searchQuery: '',
    });

    this.manualFilteredCourts = [...this.courts];
    this.noCourtsMessage = '';
    this.currentPage = 1;
    this.updateVisibleCourts();
    this.recomputeSidebarTimeOptions();
  }

  /* ========== Time helpers ========== */
  private timeStringToMinutes(t: string): number {
    if (!t) return 0;
    const [timePart, ampm] = t.split(' ');
    const [hhStr, mmStr] = timePart.split(':');
    let hh = parseInt(hhStr, 10);
    const mm = parseInt(mmStr, 10);
    if ((ampm || '').toUpperCase() === 'PM' && hh !== 12) hh += 12;
    if ((ampm || '').toUpperCase() === 'AM' && hh === 12) hh = 0;
    return hh * 60 + mm;
  }

  private minutesToTimeString(mins: number): string {
    mins = ((mins % (24 * 60)) + (24 * 60)) % (24 * 60);
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const displayHour = ((hh + 11) % 12) + 1;
    return `${String(displayHour).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`;
  }

  private intervalsOverlap(startA: number, durationA: number, startB: number, durationB: number): boolean {
    const endA = startA + durationA;
    const endB = startB + durationB;
    return startA < endB && startB < endA;
  }

  private isPastSlot(slotMinutes: number, date: Date): boolean {
    const now = new Date();
    const slotDateKey = this.toKey(date);
    const todayKey = this.toKey(now);
    if (slotDateKey !== todayKey) return false;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return slotMinutes <= nowMinutes;
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

  /* ========== Availability & popup logic ========== */
  toKey(d: Date): string {
    return toKeyLocal(d);
  }

  recomputeAvailability(): void {
    if (!this.selectedCourt) {
      this.bookedForDay = [];
      this.timeSlotItems = [];
      return;
    }

    const key = this.toKey(this.selectedBookingDate);
    const booked = this.selectedCourt.bookedSlots?.[key] ?? [];
    this.bookedForDay = booked.slice().sort();

    const duration = Number(this.form.get('matchDuration')?.value) || 60;
    const bookedMinutes = booked.map(b => this.timeStringToMinutes(b));
    const openMin = this.timeStringToMinutes(this.selectedCourt.openingTime ?? '00:00 AM');
    const closeMin = this.timeStringToMinutes(this.selectedCourt.closingTime ?? '11:59 PM');

    const stepMinutes = duration;
    const generatedSlots = this.generateSlots(openMin, closeMin, stepMinutes, duration);

    this.timeSlotItems = generatedSlots
      .map(slot => {
        const slotMin = this.timeStringToMinutes(slot);
        const past = this.isPastSlot(slotMin, this.selectedBookingDate);

        let overlapsBooked = false;
        for (const bMin of bookedMinutes) {
          if (this.intervalsOverlap(slotMin, duration, bMin, duration)) {
            overlapsBooked = true;
            break;
          }
        }

        return { text: slot, disabled: overlapsBooked, _past: past };
      })
      .filter(i => !i._past)
      .map(i => ({ text: i.text, disabled: i.disabled }));

    if (this.selectedBookingTime) {
      const sel = this.timeSlotItems.find(i => i.text === this.selectedBookingTime);
      if (!sel || sel.disabled) {
        this.selectedBookingTime = '';
      }
    }
  }

  onBookingDateChanged(e: any): void {
    this.selectedBookingDate = e.value;
    this.recomputeAvailability();
  }

  openCourtDetails(court: Court): void {
    this.selectedCourt = court;
    const sidebarDate = this.form.get('selectedDate')?.value;
    this.selectedBookingDate = sidebarDate instanceof Date ? sidebarDate : new Date();
    this.selectedBookingTime = '';
    this.selectedPitchSize = '';
    this.recomputeAvailability();
    this.popupVisible = true;
  }

  onTimeItemClick(e: any, dropDownBoxRef: any): void {
    const item = e.itemData as { text: string; disabled: boolean };
    if (item.disabled) return;
    this.selectedBookingTime = item.text;
    try { dropDownBoxRef.instance.close(); } catch {}
  }

  onSidebarTimeSelect(e: any, dropDownRef?: any): void {
    const item = e.itemData as { text: string; disabled: boolean };
    if (item.disabled) return;
    this.form.get('selectedTime')?.setValue(item.text);
    try { dropDownRef.instance.close(); } catch {}
  }

  selectPitch(size: any): void {
    if (this.selectedPitchSize === size.pitchtype) {
      this.selectedPitchSize = '';
    } else {
      this.selectedPitchSize = size.pitchtype;
    }
  }
  
  get selectedPitchPrice60(): number | null {
    if (!this.selectedCourt || !this.selectedPitchSize) return null;
  
    const pitch = this.selectedCourt.pitches.find(
      p => p.pitchtype === this.selectedPitchSize
    );
  
    return pitch ? pitch.price : null;
  }
  
  getComputedPrice(): number {
    if (!this.selectedCourt) return 0;
  
    const duration = Number(this.form.get('matchDuration')?.value) || 60;
    const basePrice = this.selectedPitchPrice60 ?? this.getCourtMinPrice(this.selectedCourt);
  
    return Math.round(basePrice * (duration / 60));
  }
  
  getCourtMinPrice(court: Court | null): number {
    if (!court || !court.pitches.length) return 0;
  
    const prices = court.pitches.map(p => p.price);
    return Math.min(...prices);
  }
  

  get allSlotsDisabled(): boolean {
    return this.timeSlotItems.length > 0 && this.timeSlotItems.every(i => i.disabled);
  }

  getOfferIcon(offer: string): string {
    const label = (offer || '').toLowerCase();
    if (label.includes('toilet') || label.includes('restroom')) return '🚻';
    if (label.includes('shower')) return '🚿';
    if (label.includes('water') || label.includes('drinking')) return '💧';
    if (label.includes('changing') || label.includes('change')) return '👕';
    if (label.includes('parking')) return '🅿️';
    if (label.includes('cafeteria') || label.includes('cafe') || label.includes('coffee')) return '☕';
    if (label.includes('equipment') || label.includes('rental')) return '🧰';
    return '✔️';
  }

  get galleryImages(): string[] {
    if (!this.selectedCourt) return [];
    if (this.selectedCourt.images && this.selectedCourt.images.length) return this.selectedCourt.images;
    return this.selectedCourt.image ? [this.selectedCourt.image] : [];
  }

  /* ========== Sidebar 24-hour slot generation (public for template) ========== */
  public recomputeSidebarTimeOptions(): void {
    const duration = Number(this.form.get('matchDuration')?.value) || 60;
    let sidebarOpenMin = this.selectedCourt?.openingMinutes 
    let sidebarCloseMin = this.selectedCourt?.closingMinutes;
    const stepMinutes = duration;
    if (sidebarOpenMin == null || sidebarCloseMin == null) {
       sidebarOpenMin = 0; // 00:00
       sidebarCloseMin = 24 * 60; // end of day
      // this.timeOptionsSidebar = [];
      // return;
    }
    const generated = this.generateSlots(sidebarOpenMin, sidebarCloseMin, stepMinutes, duration);
    const selDate = this.form.get('selectedDate')?.value instanceof Date ? this.form.get('selectedDate')!.value : new Date();

    this.timeOptionsSidebar = generated
      .map(s => {
        const mins = this.timeStringToMinutes(s);
        const past = this.isPastSlot(mins, selDate);
        return { text: s, disabled: false, _past: past };
      })
      .filter(i => !i._past)
      .map(i => ({ text: i.text, disabled: false }));

    const cur = this.form.get('selectedTime')?.value;
    if (cur) {
      const found = this.timeOptionsSidebar.find(i => i.text === cur);
      if (!found) {
        this.form.get('selectedTime')?.setValue('');
      }
    }
  }

  private isCourtAvailableAt(court: Court, date: Date, startMin: number, duration: number): boolean {
    const openMin = this.timeStringToMinutes(court.openingTime ?? '00:00 AM');
    const closeMin = this.timeStringToMinutes(court.closingTime ?? '11:59 PM');

    if (startMin < openMin) return false;
    if (startMin + duration > closeMin) return false;

    const key = this.toKey(date);
    const booked = court.bookedSlots?.[key] ?? [];
    const bookedMinutes = booked.map(b => this.timeStringToMinutes(b));

    for (const bMin of bookedMinutes) {
      if (this.intervalsOverlap(startMin, duration, bMin, duration)) {
        return false;
      }
    }
    return true;
  }

  /* ================= Payment review & upload/reservation ================= */

  openPaymentReview(): void {
    if (!this.selectedCourt) { alert('No court selected.'); return; }
    if (!this.selectedBookingDate) { alert('Please select a booking date.'); return; }
    if (!this.selectedBookingTime) { alert('Please select a time slot.'); return; }
    if (!this.selectedPitchSize) { alert('Please select a pitch size.'); return; }

    this.paymentProofFile = null;
    this.paymentProofPreviewUrl = null;
    this.paymentPopupVisible = true;
    this.startReservationTimer();
    this.loadOwnerPaymentDetails(this.selectedCourt.OwnerId)
  }
  
  loadOwnerPaymentDetails(ownerId: number): void {
    const whereClause = `co.ownerid = ${ownerId}`
    this.GetDatabyDatasourceService.getData(2,whereClause).subscribe({
      next: (data: any[] | null | undefined) => {
        if (data && data.length > 0) {
          this.ownerPaymentMethods = data;
        }
      },
      error: (err) => {
        console.error('Error fetching owner payment details', err);
      }
    });
  }
// Helper: Convert "03:00 PM" -> "15:00:00"
formatTo24Hour(timeStr: string): string {
  const date = new Date("1970-01-01 " + timeStr);
  return date.toTimeString().split(" ")[0]; // "15:00:00"
}

// Helper: Add minutes to startTime
calculateEndTime(start: string, duration: number): string {
  const [h, m, s] = start.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, s || 0);
  date.setMinutes(date.getMinutes() + duration);
  return date.toTimeString().split(" ")[0]; // "16:00:00"
}
  saveBooking(): void {
    if (!this.paymentProofFile) {
      alert('Please upload payment proof');
      return;
    }
    console.log(this.selectedCourt)
       const bookingDate = this.toKey(this.selectedBookingDate); 
const selectedPitch = this.selectedCourt?.pitches.find(
  (p: any) => p.pitchtype === this.selectedPitchSize
);
  // const courtPitchId = selectedPitch?.pitchid;
  const startTime = this.formatTo24Hour(this.selectedBookingTime); // "15:00:00"
  const duration = Number(this.form.get('matchDuration')?.value) || 60;
  const endTime = this.calculateEndTime(startTime, duration);      // e.g. "16:00:00"
  const body = {
    courtId: this.selectedCourt?.courtId,
    courtPitchId: 1,//courtPitchId,
    ownerId: this.selectedCourt?.OwnerId,
    userId: 1,
    paymentMethodId: 1,
    paymentProof: this.paymentProofFile.name,
    bookingDate: bookingDate,
    startTime: startTime,
    endTime: endTime,
    price: this.getComputedPrice()
  };

         console.log('bookingData : ',body) 
    //       {
    //   court: this.selectedCourt?.name,
    //   date: this.toKey(this.selectedBookingDate),
    //   time: this.selectedBookingTime,
    //   pitch: this.selectedPitchSize,
    //   duration: this.form.get('matchDuration')?.value,
    //   amount: this.getComputedPrice(),
    //   fileName: this.paymentProofFile.name
    // });

    this.saveBookingsService.createBooking(body).subscribe({
      next: (res:any) => {
        console.log('Booking saved successfully', res);
        alert('Booking created!');
  
          this.paymentPopupVisible = false;
          this.popupVisible = false;
          this.stopReservationTimer();
        },
        error: (err:any) => {
          console.error('Error saving booking:', err);
          alert('Booking failed.');
        }
      });
    };
  
  
  


  onFileUpload(e: any): void {
    const files: File[] = e?.value || [];
    if (!files || files.length === 0) {
      this.paymentProofFile = null; this.paymentProofPreviewUrl = null; return;
    }
    const f = files[0];
    const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(f.type)) {
      alert('Only JPG or PNG images are accepted as payment proof. Please upload a valid file.');
      this.paymentProofFile = null; this.paymentProofPreviewUrl = null; return;
    }
    this.paymentProofFile = f;
    const reader = new FileReader();
    reader.onload = (ev: any) => this.paymentProofPreviewUrl = ev.target.result;
    reader.readAsDataURL(f);
  }

  submitPaymentProof(): void {
    this.saveBooking()
    if (!this.paymentProofFile) { alert('Please upload payment proof (JPG/PNG) before submitting.'); return; }
    if (this.reservationExpired) { alert('Reservation has expired. Please restart booking to proceed.'); return; }

    console.log('Submitting payment proof:', {
      court: this.selectedCourt?.name,
      date: this.toKey(this.selectedBookingDate),
      time: this.selectedBookingTime,
      pitch: this.selectedPitchSize,
      duration: this.form.get('matchDuration')?.value,
      amount: this.getComputedPrice(),
      fileName: this.paymentProofFile.name
    });

    alert('Payment proof submitted successfully. We will verify and confirm your booking shortly.');
    this.paymentPopupVisible = false;
    this.popupVisible = false;
    this.stopReservationTimer();
    this.paymentProofFile = null;
    this.paymentProofPreviewUrl = null;
  }

  goBackToBooking(): void {
    this.paymentPopupVisible = false;
    this.popupVisible = true;
    // reservation continues
  }

  /* ===== Reservation timer controls (public stop for template usage) ===== */
  private startReservationTimer(): void {
    this.stopReservationTimer();
    this.reservationExpiresAt = Date.now() + this.RESERVATION_MINUTES * 60 * 1000;
    this.reservationExpired = false;
    this.updateReservationRemaining();
    this.reservationTimerRef = setInterval(() => this.updateReservationRemaining(), 1000);
  }

  public stopReservationTimer(): void {
    if (this.reservationTimerRef) { clearInterval(this.reservationTimerRef); this.reservationTimerRef = null; }
    this.reservationExpiresAt = null;
    this.reservationRemaining = '';
    this.reservationExpired = false;
  }

  private updateReservationRemaining(): void {
    if (!this.reservationExpiresAt) {
      this.reservationRemaining = '';
      this.reservationExpired = false;
      return;
    }
    const msLeft = this.reservationExpiresAt - Date.now();
    if (msLeft <= 0) {
      this.reservationRemaining = '00:00';
      this.reservationExpired = true;
      this.stopReservationTimer();
      return;
    }
    const totalSeconds = Math.floor(msLeft / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    this.reservationRemaining = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    this.reservationExpired = false;
  }


  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.stopReservationTimer();
  }
}
