import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  DxButtonModule,
  DxFileUploaderModule,
  DxPopupModule
} from 'devextreme-angular';
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';
import { SaveBookingsService } from '../../services/bookings/save-bookings.service';
import { Court } from '../../models/setupModels';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    DxButtonModule,
    DxFileUploaderModule,
    DxPopupModule
  ],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentBookingComponent implements OnDestroy {
  @Input() paymentPopupVisible = false;
  @Input() selectedCourt: Court | null = null;
  @Input() selectedBookingDate!: Date;
  @Input() selectedBookingTime = '';
  @Input() selectedPitchSize = '';
  @Input() form!: FormGroup;
  
  @Output() paymentPopupVisibleChange = new EventEmitter<boolean>();
  @Output() bookingComplete = new EventEmitter<void>();
  @Output() backToDetails = new EventEmitter<void>();
  
  paymentProofFile: File | null = null;
  paymentProofPreviewUrl: string | null = null;
  
  readonly RESERVATION_MINUTES = 15;
  reservationExpiresAt: number | null = null;
  reservationRemaining = '';
  private reservationTimerRef: any = null;
  reservationExpired = false;
  
  ownerPaymentMethods: any;
  userId: any;
  isBrowser = false;

  constructor(
    private GetDatabyDatasourceService: GetDatabyDatasourceService,
    private saveBookingsService: SaveBookingsService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  openPaymentReview(): void {
    if (!this.selectedCourt) { alert('No court selected.'); return; }
    if (!this.selectedBookingDate) { alert('Please select a booking date.'); return; }
    if (!this.selectedBookingTime) { alert('Please select a time slot.'); return; }
    if (!this.selectedPitchSize) { alert('Please select a pitch size.'); return; }

    this.paymentProofFile = null;
    this.paymentProofPreviewUrl = null;
    this.paymentPopupVisible = true;
    this.paymentPopupVisibleChange.emit(true);
    this.startReservationTimer();
    this.loadOwnerPaymentDetails(this.selectedCourt.OwnerId);
  }

  closePaymentPopup(): void {
    this.paymentPopupVisible = false;
    this.paymentPopupVisibleChange.emit(false);
    this.stopReservationTimer();
  }

  loadOwnerPaymentDetails(ownerId: number): void {
    const whereClause = `co.ownerid = ${ownerId}`;
    this.GetDatabyDatasourceService.getData(2, whereClause).subscribe({
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

  formatTo24Hour(timeStr: string): string {
    const date = new Date("1970-01-01 " + timeStr);
    return date.toTimeString().split(" ")[0];
  }

  calculateEndTime(start: string, duration: number): string {
    const [h, m, s] = start.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, s || 0);
    date.setMinutes(date.getMinutes() + duration);
    return date.toTimeString().split(" ")[0];
  }

  saveBooking(): void {
    if (!this.paymentProofFile) {
      alert('Please upload payment proof');
      return;
    }
    
    console.log(this.selectedCourt);
    const saved = localStorage.getItem('loggedInUser');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        console.log(p);
        this.userId = p.userId;
      } catch { }
    }
    
    const bookingDate = this.toKey(this.selectedBookingDate); 
    const selectedPitch = this.selectedCourt?.pitches.find(
      (p: any) => p.pitchtype === this.selectedPitchSize
    );
    const startTime = this.formatTo24Hour(this.selectedBookingTime);
    const duration = Number(this.form.get('matchDuration')?.value) || 60;
    const endTime = this.calculateEndTime(startTime, duration);
    
    const body = {
      courtId: this.selectedCourt?.courtId,
      courtPitchId: 1,
      ownerId: this.selectedCourt?.OwnerId,
      userId: this.userId,
      paymentMethodId: 1,
      paymentProof: this.paymentProofFile.name,
      bookingDate: bookingDate,
      startTime: startTime,
      endTime: endTime,
      price: this.getComputedPrice()
    };

    this.saveBookingsService.createBooking(body).subscribe({
      next: (res: any) => {
        console.log('Booking saved successfully', res);
        alert('Booking created!');
        this.paymentPopupVisible = false;
        this.paymentPopupVisibleChange.emit(false);
        this.stopReservationTimer();
        this.bookingComplete.emit();
      },
      error: (err: any) => {
        console.error('Error saving booking:', err);
        alert('Booking failed.');
      }
    });
  }

  onFileUpload(e: any): void {
    const files: File[] = e?.value || [];
    if (!files || files.length === 0) {
      this.paymentProofFile = null; 
      this.paymentProofPreviewUrl = null; 
      return;
    }
    const f = files[0];
    const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(f.type)) {
      alert('Only JPG or PNG images are accepted as payment proof. Please upload a valid file.');
      this.paymentProofFile = null; 
      this.paymentProofPreviewUrl = null; 
      return;
    }
    this.paymentProofFile = f;
    const reader = new FileReader();
    reader.onload = (ev: any) => this.paymentProofPreviewUrl = ev.target.result;
    reader.readAsDataURL(f);
  }

  submitPaymentProof(): void {
    this.saveBooking();
    
    if (!this.paymentProofFile) { 
      alert('Please upload payment proof (JPG/PNG) before submitting.'); 
      return; 
    }
    if (this.reservationExpired) { 
      alert('Reservation has expired. Please restart booking to proceed.'); 
      return; 
    }

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
    this.paymentPopupVisibleChange.emit(false);
    this.stopReservationTimer();
    this.paymentProofFile = null;
    this.paymentProofPreviewUrl = null;
  }

  goBackToBooking(): void {
    this.paymentPopupVisible = false;
    this.paymentPopupVisibleChange.emit(false);
    this.backToDetails.emit();
  }

  getComputedPrice(): number {
    if (!this.selectedCourt) return 0;
    
    const duration = Number(this.form.get('matchDuration')?.value) || 60;
    const pitch = this.selectedCourt.pitches.find(
      p => p.pitchtype === this.selectedPitchSize
    );
    const basePrice = pitch ? pitch.price : this.getCourtMinPrice(this.selectedCourt);
    
    return Math.round(basePrice * (duration / 60));
  }

  getCourtMinPrice(court: Court | null): number {
    if (!court || !court.pitches.length) return 0;
    const prices = court.pitches.map(p => p.price);
    return Math.min(...prices);
  }

  startReservationTimer(): void {
    this.stopReservationTimer();
    this.reservationExpiresAt = Date.now() + this.RESERVATION_MINUTES * 60 * 1000;
    this.reservationExpired = false;
    this.updateReservationRemaining();
    this.reservationTimerRef = setInterval(() => this.updateReservationRemaining(), 1000);
  }

  stopReservationTimer(): void {
    if (this.reservationTimerRef) { 
      clearInterval(this.reservationTimerRef); 
      this.reservationTimerRef = null; 
    }
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

  toKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  ngOnDestroy(): void {
    this.stopReservationTimer();
  }
}