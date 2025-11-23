import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PendingApproval {
  bookingId: number;
  courtId: number;
  courtName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  price: number;
  paymentProof: string;
  reservedUntil: string;
  userName: string;
  userPhone: string;
  timeRemaining: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentApprovalService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  approvePayment(bookingId: number, token?: string): Observable<any> {
    const url = token 
      ? `${this.apiUrl}/PaymentApproval/approve/${bookingId}?token=${token}`
      : `${this.apiUrl}/PaymentApproval/approve/${bookingId}`;
    return this.http.post(url, {});
  }

  rejectPayment(bookingId: number, reason: string, token?: string): Observable<any> {
    const url = token 
      ? `${this.apiUrl}/PaymentApproval/reject/${bookingId}?token=${token}`
      : `${this.apiUrl}/PaymentApproval/reject/${bookingId}`;
    return this.http.post(url, { reason });
  }

  getPendingApprovals(ownerId: number): Observable<PendingApproval[]> {
    return this.http.get<PendingApproval[]>(`${this.apiUrl}/PaymentApproval/pending/${ownerId}`);
  }
}

