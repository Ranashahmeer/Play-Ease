import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CourtDto {
  CourtID?: number;
  Name: string;
  Location: string;
  Rating?: number;
  OpeningTime?: string;
  ClosingTime?: string;
  About?: string;
  MainImage?: string;
  OwnerID: number;
  Pitches: PitchDto[];
  Images?: string[];
}

export interface PitchDto {
  PitchType: string;
  Price: number;
}

@Injectable({
  providedIn: 'root'
})
export class CourtService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  createCourt(court: CourtDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/Courts/create`, court);
  }

  updateCourt(courtId: number, court: CourtDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/Courts/update/${courtId}`, court);
  }
}

