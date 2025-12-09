import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PlayerRating {
  ratingID: number;
  matchID: number;
  ratedByUserID: number;
  ratedByUserName: string;
  ratedUserID: number;
  ratedUserName: string;
  rating: number;
  reviewText: string | null;
  reviewDate: Date;
  formattedDate: string;
  matchTitle: string;
}

export interface PlayerRatingSummary {
  userID: number;
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    [key: number]: number;
  };
}

export interface CreatePlayerRating {
  matchID: number;
  ratedByUserID: number;
  ratedUserID: number;
  rating: number;
  reviewText?: string;
}

export interface MatchPlayer {
  userID: number;
  userName: string;
  role: string;
  canRate: boolean;
  alreadyRated: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerRatingsService {
  private apiUrl = 'http://localhost:5000/api/playerratings';

  constructor(private http: HttpClient) { }

  getUserRatings(userId: number, top: number = 10, includeAll: boolean = false): Observable<PlayerRating[]> {
    return this.http.get<PlayerRating[]>(`${this.apiUrl}/user/${userId}?top=${top}&includeAll=${includeAll}`);
  }

  getUserRatingSummary(userId: number): Observable<PlayerRatingSummary> {
    return this.http.get<PlayerRatingSummary>(`${this.apiUrl}/summary/${userId}`);
  }

  getMatchPlayers(matchId: number, currentUserId: number): Observable<MatchPlayer[]> {
    return this.http.get<MatchPlayer[]>(`${this.apiUrl}/match/${matchId}/players/${currentUserId}`);
  }

  createPlayerRating(rating: CreatePlayerRating): Observable<any> {
    return this.http.post(`${this.apiUrl}`, rating);
  }

  deletePlayerRating(ratingId: number, userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${ratingId}?userId=${userId}`);
  }
}

