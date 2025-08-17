import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SaveBookings } from '../../models/setupModels';

@Injectable({
  providedIn: 'root'
})
export class SaveBookingsService {
  private baseUrl = 'https://localhost:7267/api/SaveBookings'; 

  constructor(private http: HttpClient) {}

  createBooking(booking: SaveBookings): Observable<any> {
    return this.http.post(`${this.baseUrl}/create`, booking);
  }
}
