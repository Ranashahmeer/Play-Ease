import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MatchRequest {
  id: number;
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
  isOwn?: boolean;
}

export interface CreateMatchDto {
  userId: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  roles: string;
  numPlayers: number;
  price: number;
}

export interface Applicant {
  id: number;
  userName: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
  userId: number;
}

export interface Application {
  matchId: number;
  userId: number;
  userName: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private apiUrl = "https://localhost:7267/api";

  constructor(private http: HttpClient) {}

  // Get all match requests
  getAllRequests(): Observable<MatchRequest[]> {
    return this.http.get<MatchRequest[]>(`${this.apiUrl}/Matches`);
  }

  // Get available requests (excluding user's own requests)
  getAvailableRequests(userId: number): Observable<MatchRequest[]> {
    return this.http.get<MatchRequest[]>(`${this.apiUrl}/Matches/available/${userId}`);
  }

  // Get user's own requests
  getMyRequests(userId: number): Observable<MatchRequest[]> {
    return this.http.get<MatchRequest[]>(`${this.apiUrl}/Matches/my/${userId}`);
  }

  // ✅ FIXED: Create a new match request - accepts CreateMatchDto
  createRequest(request: CreateMatchDto): Observable<MatchRequest> {
    return this.http.post<MatchRequest>(`${this.apiUrl}/Matches`, request);
  }

  // Get applicants for a specific match
  getApplicants(matchId: number): Observable<Applicant[]> {
    return this.http.get<Applicant[]>(`${this.apiUrl}/Matches/${matchId}/applicants`);
  }

  // Apply to a match
  applyToMatch(application: Application): Observable<any> {
    return this.http.post(`${this.apiUrl}/Matches/apply`, application);
  }

  // Update applicant status (accept/reject)
  updateApplicantStatus(data: { requestId: number; applicantId: number; status: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/Matches/${data.requestId}/applicants/${data.applicantId}`, {
      status: data.status
    });
  }
}