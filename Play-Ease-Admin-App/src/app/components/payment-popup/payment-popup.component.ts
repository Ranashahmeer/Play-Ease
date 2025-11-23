import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DxPopupModule, DxFileUploaderComponent, DxButtonModule } from 'devextreme-angular';
import { CommonModule } from '@angular/common';
import { SaveBookingsService } from '../../services/bookings/save-bookings.service';
import { SaveBookings, OwnerPaymentDetail } from '../../models/setupModels';
import { forkJoin } from 'rxjs';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-payment-popup',
  standalone: true,
  imports: [DxPopupModule, DxFileUploaderComponent, DxButtonModule, CommonModule],
  templateUrl: './payment-popup.component.html',
  styleUrl: './payment-popup.component.css'
})
export class PaymentPopupComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() reservationExpired = false;
  @Input() reservationRemaining: string = '';
  @Input() ownerPaymentMethods: OwnerPaymentDetail[] = [];
  @Input() bookingData: SaveBookings = {} as SaveBookings;
  @Input() totalPrice: number = 0;
  @Input() slotDuration: number = 60;
  
  paymentProofFile: File | null = null;
  paymentProofPreviewUrl: string | null = null;
  isSubmitting = false;
  selectedPaymentMethod: OwnerPaymentDetail | null = null;
  validationErrors: string[] = [];

  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly VALID_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  constructor(
    private saveBookingsService: SaveBookingsService,
    private alertService: AlertService
  ) {}

  get hasMultipleSlots(): boolean {
    return !!(this.bookingData?.selectedSlots?.length && this.bookingData.selectedSlots.length > 1);
  }

  get canSubmit(): boolean {
    return !!(this.paymentProofFile && this.selectedPaymentMethod && !this.reservationExpired && !this.isSubmitting);
  }

  onPaymentMethodSelect(method: OwnerPaymentDetail): void {
    this.selectedPaymentMethod = method;
    this.validationErrors = this.validationErrors.filter(e => !e.includes('payment method'));
  }

  getPaymentMethodIcon(method: OwnerPaymentDetail): string {
    if (!method?.MethodName) return 'credit-card';
    const name = method.MethodName.toLowerCase();
    if (name.includes('easypaisa') || name.includes('jazzcash')) return 'mobile';
    if (name.includes('bank')) return 'bank';
    return 'credit-card';
  }

  onFileUpload(event: any): void {
    const file = event.value?.[0];
    if (!file) return;

    if (!this.VALID_FILE_TYPES.includes(file.type)) {
      this.alertService.error('Please upload a JPEG or PNG image');
      return;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      this.alertService.error('Image size must be less than 5MB');
      return;
    }

    this.paymentProofFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.paymentProofPreviewUrl = e.target?.result as string;
      this.validationErrors = this.validationErrors.filter(e => !e.includes('payment proof'));
    };
    reader.readAsDataURL(file);
  }

  validateForm(): boolean {
    this.validationErrors = [];
    const { bookingData, selectedPaymentMethod, paymentProofFile } = this;

    if (!selectedPaymentMethod) this.validationErrors.push('Please select a payment method');
    if (!paymentProofFile) this.validationErrors.push('Please upload payment proof image');
    if (!bookingData?.CourtId) this.validationErrors.push('Court information is missing');
    if (!bookingData?.userId) this.validationErrors.push('User information is missing');
    if (!bookingData || bookingData.price <= 0) this.validationErrors.push('Invalid booking price');

    if (paymentProofFile) {
      if (!this.VALID_FILE_TYPES.includes(paymentProofFile.type)) {
        this.validationErrors.push('Payment proof must be a JPEG or PNG image');
      }
      if (paymentProofFile.size > this.MAX_FILE_SIZE) {
        this.validationErrors.push('Payment proof image must be less than 5MB');
      }
    }

    return this.validationErrors.length === 0;
  }

  submitPaymentProof(): void {
    if (!this.validateForm()) {
      this.alertService.error('Please fix the following errors:\n' + this.validationErrors.join('\n'));
      return;
    }

    if (!this.selectedPaymentMethod || !this.bookingData) return;

    this.isSubmitting = true;
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        const slotsToBook = (this.bookingData as any).selectedSlots || [this.bookingData.startTime];
        const duration = this.slotDuration || 60;
        
        const bookingPayloads: SaveBookings[] = slotsToBook.map((slot: string) => {
          const startMin = this.timeStringToMinutes(slot);
          const endTime = this.minutesToTimeString(startMin + duration);
          return {
            ...this.bookingData,
            paymentMethodId: this.selectedPaymentMethod!.MethodID,
            paymentProof: base64String,
            startTime: this.convertToTimeSpan(slot),
            endTime: this.convertToTimeSpan(endTime)
          };
        });

        this.createMultipleBookings(bookingPayloads);
      } catch (error) {
        console.error('Error processing payment proof:', error);
        this.alertService.error('Error processing payment proof. Please try again.');
        this.isSubmitting = false;
      }
    };

    reader.onerror = () => {
      this.alertService.error('Error reading payment proof file. Please try again.');
      this.isSubmitting = false;
    };

    reader.readAsDataURL(this.paymentProofFile!);
  }

  private createMultipleBookings(bookings: SaveBookings[]): void {
    forkJoin(bookings.map(b => this.saveBookingsService.createBooking(b))).subscribe({
      next: (responses: any[]) => {
        const slotCount = bookings.length;
        const firstResponse = responses[0];
        
        // Check if booking is in reservation state
        if (firstResponse?.status === 'PendingPaymentApproval' || firstResponse?.reservedUntil) {
          const reservedUntil = firstResponse.reservedUntil 
            ? new Date(firstResponse.reservedUntil) 
            : new Date(Date.now() + 30 * 60 * 1000);
          
          this.alertService.info(
            `Reservation created! Waiting for owner approval. You have ${Math.round((reservedUntil.getTime() - Date.now()) / 60000)} minutes.`, 
            8000
          );
        } else {
          const bookingIds = responses.map(r => r.bookingId || 'N/A').join(', ');
          this.alertService.success(`Successfully booked ${slotCount} time slot${slotCount > 1 ? 's' : ''}! Booking ID(s): ${bookingIds}`, 4000);
        }
        
        this.resetForm();
        this.visibleChange.emit(false);
        setTimeout(() => window.location.reload(), 2000);
      },
      error: (error: any) => {
        console.error('Booking error:', error);
        this.alertService.error(error?.error?.error || error?.message || 'Failed to submit booking. Please try again.');
        this.isSubmitting = false;
      }
    });
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

  private minutesToTimeString(mins: number): string {
    mins = ((mins % 1440) + 1440) % 1440;
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const displayHour = ((hh + 11) % 12) + 1;
    return `${String(displayHour).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`;
  }

  private convertToTimeSpan(time12hr: string): string {
    const [timePart, ampm] = time12hr.split(' ');
    const [hours, minutes] = timePart.split(':').map(Number);
    let hours24 = hours;
    if (ampm?.toUpperCase() === 'PM' && hours !== 12) hours24 += 12;
    if (ampm?.toUpperCase() === 'AM' && hours === 12) hours24 = 0;
    return `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  }

  resetForm(): void {
    this.paymentProofFile = null;
    this.paymentProofPreviewUrl = null;
    this.selectedPaymentMethod = null;
    this.validationErrors = [];
    this.isSubmitting = false;
  }

  cancel(): void {
    this.visibleChange.emit(false);
  }
}
