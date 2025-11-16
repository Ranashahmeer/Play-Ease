import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MatchRequest {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  roles: string;
  numPlayers: number;
  price: number;
  organizer: string;
  organizerId: number;
}

@Injectable({
  providedIn: 'root'
})
export class RequestPlayerService {

  private apiUrl = 'http://localhost:5000/api/RequestPlayer'; // Update your API URL

  constructor(private http: HttpClient) { }

  createMatch(match: MatchRequest): Observable<MatchRequest> {
    return this.http.post<MatchRequest>(this.apiUrl, match);
  }
}
