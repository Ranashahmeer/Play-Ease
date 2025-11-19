import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SaveBookings } from '../../models/setupModels';

@Injectable({
  providedIn: 'root'
})
export class SaveBookingsService {
  private baseUrl = 'http://localhost:5000/api/SaveBookings'; 

  constructor(private http: HttpClient) {}

  createBooking(booking: SaveBookings): Observable<any> {
    return this.http.post(`${this.baseUrl}/create`, booking);
  }

  cancelBooking(id: number) {
    return this.http.put(`${this.baseUrl}/cancel/${id}`, {});
  }
}
