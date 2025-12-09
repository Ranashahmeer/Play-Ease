import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Review {
  reviewID: number;
  courtID: number;
  userID: number;
  userName: string;
  rating: number;
  reviewText: string | null;
  reviewDate: Date;
  formattedDate: string;
}

export interface RatingSummary {
  courtID: number;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    [key: number]: number;
  };
}

export interface CreateReview {
  courtID: number;
  userID: number;
  rating: number;
  reviewText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {
  private apiUrl = 'http://localhost:5000/api/reviews'; // Update port if your backend runs on different port

  constructor(private http: HttpClient) {}

  getCourtReviews(courtId: number, top: number = 3, includeAll: boolean = false): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/court/${courtId}?top=${top}&includeAll=${includeAll}`);
  }

  getCourtRatingSummary(courtId: number): Observable<RatingSummary> {
    return this.http.get<RatingSummary>(`${this.apiUrl}/rating/${courtId}`);
  }

  createReview(review: CreateReview): Observable<any> {
    return this.http.post(`${this.apiUrl}`, review);
  }

  deleteReview(reviewId: number, userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${reviewId}?userId=${userId}`);
  }
}

