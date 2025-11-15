import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DxPopupModule, DxFileUploaderComponent,DxButtonModule } from 'devextreme-angular';
import { CommonModule } from '@angular/common';

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

  paymentProofFile: any = null;
  paymentProofPreviewUrl: string | null = null;

  onFileUpload(event: any) {
    this.paymentProofFile = event.value[0];
    const reader = new FileReader();
    reader.onload = e => this.paymentProofPreviewUrl = e.target?.result as string;
    reader.readAsDataURL(this.paymentProofFile);
  }

  submitPaymentProof() {
    // call API to submit payment proof
    alert('Payment submitted!');
    this.visibleChange.emit(false);
  }

  cancel() {
    this.visibleChange.emit(false);
  }
}