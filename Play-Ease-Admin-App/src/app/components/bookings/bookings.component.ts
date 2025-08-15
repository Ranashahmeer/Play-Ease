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

/* ===== Utility used both outside and inside the component ===== */
function toKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
const TODAY_KEY = toKeyLocal(new Date());
interface Court {
  name: string;
  location: string;
  rating: number;
  pitches: string[];
  price: number; // fallback/base price for 60 minutes
  pricePerPitch?: Record<string, number>; // variable pricing per pitch size (per 60 min)
  openingTime?: string;  // e.g. '06:00 AM'
  closingTime?: string;  // e.g. '10:00 PM'
  image: string;
  images?: string[];
  offers?: string[];
  about?: string;
  bookedSlots?: Record<string, string[]>;
}

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

  // Master data
  allCourts: Court[] = [
    {
      name: 'Alpha Arena',
      location: 'Gulberg',
      rating: 4.5,
      pitches: ['5x5', '6x6'],
      price: 5000,
      pricePerPitch: { '5x5': 2000, '6x6': 2500 },
      openingTime: '06:00 AM',
      closingTime: '10:00 PM',
      image: 'assets/alphaarena.jpg',
      images: ['assets/alphaarena-1.jpg','assets/alphaarena-2.jpg','assets/alphaarena-3.jpg'],
      offers: ['Toilet', 'Shower', 'Drinking Water', 'Changing Room', 'Parking'],
      about: 'Alpha Arena is a modern turf with synthetic grass and professional floodlights. Friendly staff and on-site refreshments make it a great venue for evening matches.',
      bookedSlots: { [TODAY_KEY]: ['06:00 AM', '07:00 AM', '06:00 PM'] }
    },
    {
      name: 'Beta Grounds',
      location: 'DHA',
      rating: 4.2,
      pitches: ['7x7', '11x11'],
      price: 1800,
      pricePerPitch: { '7x7': 1800, '11x11': 3000 },
      openingTime: '07:00 AM',
      closingTime: '11:00 PM',
      image: 'assets/betagrounds.jpg',
      images: ['assets/betaground-1.jpg','assets/betaground-2.jpg','assets/betaground-3.jpg'],
      offers: ['Toilet', 'Drinking Water', 'Parking'],
      about: 'Beta Grounds offers spacious pitches suitable for 7-a-side and 11-a-side games. Well-maintained turf with easy access and secure parking.',
      bookedSlots: { [TODAY_KEY]: ['08:00 PM'] }
    },
    {
      name: 'Gamma Pitch',
      location: 'Johar',
      rating: 4.0,
      pitches: ['5x5'],
      price: 2200,
      pricePerPitch: { '5x5': 2200 },
      openingTime: '08:00 AM',
      closingTime: '10:00 PM',
      image: 'assets/gammapitch.jpg',
      images: ['assets/gammapitch-1.jpg','assets/gammapitch-2.jpg','assets/gammapitch-3.jpg'],
      offers: ['Toilet', 'Changing Room'],
      about: 'Gamma Pitch is a community favorite for short-format games and friendly tournaments. Offers quick booking and a cozy atmosphere.',
      bookedSlots: {}
    },
    {
      name: 'Delta Field',
      location: 'PECHS',
      rating: 4.3,
      pitches: ['6x6', '9x9'],
      price: 2100,
      pricePerPitch: { '6x6': 2100, '9x9': 2600 },
      openingTime: '06:30 AM',
      closingTime: '09:30 PM',
      image: 'assets/deltafields.jpg',
      images: ['assets/deltafields-1.png','assets/deltafield-2.jpg'],
      offers: ['Toilet', 'Shower', 'Parking', 'Equipment Rental'],
      about: 'Delta Field is known for its excellent drainage and even playing surface. Equipment rental is available on-site for convenience.',
      bookedSlots: {}
    },
    {
      name: 'Omega Turf',
      location: 'Nazimabad',
      rating: 4.6,
      pitches: ['5x5'],
      price: 1900,
      pricePerPitch: { '5x5': 1900 },
      openingTime: '07:00 AM',
      closingTime: '10:00 PM',
      image: 'assets/padel-omegaturf.jpg',
      images: ['assets/omegaturf-1.jpg','assets/omegaturf-2.jpeg','assets/omegaturf-3.jpg'],
      offers: ['Toilet', 'Drinking Water', 'Cafeteria'],
      about: 'Omega Turf is a premium indoor/outdoor hybrid turf offering great lighting and spectator seating. Perfect for competitive fixtures.',
      bookedSlots: {}
    }
  ];

  visibleCourts: Court[] = [];
  manualFilteredCourts: Court[] = [];

  constructor(private fb: FormBuilder,private GetDatabyDatasourceService: GetDatabyDatasourceService) {}

  ngOnInit(): void {

    this.GetDatabyDatasourceService.getData(1).subscribe({
      next: (data) => {
        console.log('API Response:', data);
        this.bookings = data;
      },
      error: (err) => console.error('API Error:', err)
    });

    this.form = this.fb.group({
      selectedDate: [new Date()],
      selectedTime: [''],
      matchDuration: [60],
      selectedPitchSizes: [[]],
      distance: [25],
      searchQuery: [''],
    });
    // react to duration / date changes
    const s1 = this.form.get('matchDuration')!.valueChanges.subscribe(() => {
      if (this.popupVisible) this.recomputeAvailability();
      this.recomputeSidebarTimeOptions();
    });
    const s2 = this.form.get('selectedDate')!.valueChanges.subscribe(() => {
      this.recomputeSidebarTimeOptions();
    });
    this.subscriptions.push(s1, s2);

    this.recomputeSidebarTimeOptions();
    this.manualFilteredCourts = [...this.allCourts];
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

    let filtered = this.allCourts.filter((court) => {
      const matchesSearch = court.name.toLowerCase().includes((searchQuery || '').toLowerCase());
      const matchesPitch = (selectedPitchSizes?.length ?? 0) === 0 || selectedPitchSizes.some((p: string) => court.pitches.includes(p));
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

    this.manualFilteredCourts = [...this.allCourts];
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

  selectPitch(size: string): void {
    if (this.selectedPitchSize === size) {
      this.selectedPitchSize = '';
    } else {
      this.selectedPitchSize = size;
    }
  }

  get selectedPitchPrice60(): number | null {
    if (!this.selectedCourt || !this.selectedPitchSize) return null;
    return this.selectedCourt.pricePerPitch?.[this.selectedPitchSize] ?? this.selectedCourt.price;
  }

  getComputedPrice(): number {
    if (!this.selectedCourt) return 0;
    const duration = Number(this.form.get('matchDuration')?.value) || 60;
    const basePrice = this.selectedPitchPrice60 ?? this.getCourtMinPrice(this.selectedCourt);
    return Math.round(basePrice * (duration / 60));
  }

  getCourtMinPrice(court: Court | null): number {
    if (!court) return 0;
    if (court.pricePerPitch) {
      const vals = Object.values(court.pricePerPitch);
      return Math.min(...vals);
    }
    return court.price;
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
    const sidebarOpenMin = 0; // 00:00
    const sidebarCloseMin = 24 * 60; // end of day
    const stepMinutes = duration;

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
  }

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
