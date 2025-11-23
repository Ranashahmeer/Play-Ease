import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { SaveBookings } from '../../models/setupModels';

@Injectable({
  providedIn: 'root'
})
export class SaveBookingsService {
  private baseUrl = 'http://localhost:5000/api/SaveBookings';
  private bookingCancelledSubject = new Subject<number>();

  // Observable for components to subscribe to booking cancellation events
  bookingCancelled$ = this.bookingCancelledSubject.asObservable();

  constructor(private http: HttpClient) {}

  createBooking(booking: SaveBookings): Observable<any> {
    console.log('Service: Sending booking to API:', booking);
    return this.http.post(`${this.baseUrl}/create`, booking);
  }
 
  cancelBooking(id: number) {
    return this.http.put(`${this.baseUrl}/cancel/${id}`, {});
  }

  // Emit event when a booking is cancelled
  emitBookingCancelled(bookingId: number): void {
    this.bookingCancelledSubject.next(bookingId);
  }
}
