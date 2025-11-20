import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DxPopupModule, DxFileUploaderComponent,DxButtonModule } from 'devextreme-angular';
import { CommonModule } from '@angular/common';
// payment-popup.component.ts
import { SaveBookingsService } from '../../services/bookings/save-bookings.service';
import { SaveBookings } from '../../models/setupModels';
@Component({
  selector: 'app-payment-popup',
  standalone: true,
  imports: [DxPopupModule, DxFileUploaderComponent,DxButtonModule,CommonModule],
  templateUrl: './payment-popup.component.html',
  styleUrl: './payment-popup.component.css'
})
export class PaymentPopupComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() reservationExpired = false;
  @Input() reservationRemaining: string = '';
  @Input() ownerPaymentMethods: any[] = [];
  @Input() bookingData!: SaveBookings; // NEW: receive booking data from parent
  paymentProofFile: any = null;
  paymentProofPreviewUrl: string | null = null;
   isSubmitting = false; // NEW: loading state

  constructor(private saveBookingsService: SaveBookingsService) {}
  onFileUpload(event: any) {
    this.paymentProofFile = event.value[0];
    const reader = new FileReader();
    reader.onload = e => this.paymentProofPreviewUrl = e.target?.result as string;
    reader.readAsDataURL(this.paymentProofFile);
  }

  /* submitPaymentProof() {
    // call API to submit payment proof
    this.visibleChange.emit(false);

  } */
  submitPaymentProof() {
  if (!this.paymentProofFile) {
    alert('Please upload payment proof!');
    return;
  }
   // ADD THIS: Check if bookingData exists
  if (!this.bookingData) {
    console.error('bookingData is undefined!');
    alert('Booking data is missing!');
    return;
  }

  // ADD THIS: Log the data before sending
  console.log('Booking Data before API call:', this.bookingData);
  this.isSubmitting = true;

  const reader = new FileReader();
  reader.onload = () => {
    const base64String = (reader.result as string).split(',')[1];
    this.bookingData.paymentProof = base64String;
        const payload = {
      dto: {
        ...this.bookingData,
        startTime: this.convertToTimeSpan(this.bookingData.startTime),
        endTime: this.convertToTimeSpan(this.bookingData.endTime)
      }
    };

    console.log('Final payload being sent:', JSON.stringify(payload, null, 2));
     console.log('Complete payload being sent:', JSON.stringify(this.bookingData, null, 2));

    this.saveBookingsService.createBooking(payload.dto).subscribe({
      next: () => {  // Remove unused 'response' parameter
        alert('Booking confirmed successfully!');
        this.isSubmitting = false;
        this.visibleChange.emit(false);
      },
      error: (error: any) => {  // Add type annotation
        console.error('Error status:', error.status);
        console.error('Error message:', error.error);
        console.error('Full error object:', JSON.stringify(error.error, null, 2));
        console.error('Booking failed:', error);
        alert('Failed to submit booking. Please try again.');
        this.isSubmitting = false;
      }
    });
  };
  reader.readAsDataURL(this.paymentProofFile);
}
private convertToTimeSpan(time12hr: string): string {
  const [timePart, ampm] = time12hr.split(' ');
  const [hours, minutes] = timePart.split(':').map(Number);
  
  let hours24 = hours;
  if (ampm.toUpperCase() === 'PM' && hours !== 12) {
    hours24 = hours + 12;
  } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
    hours24 = 0;
  }
  
  return `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}
cancel() {
  this.visibleChange.emit(false);
}
}