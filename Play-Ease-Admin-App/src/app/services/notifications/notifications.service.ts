import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';

export interface Notification {
  notificationID: number;
  userID: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedMatchID?: number;
  relatedApplicantID?: number;
  createdAt: Date;
  readAt?: Date;
}

export interface CreateNotification {
  userID: number;
  title: string;
  message: string;
  type: string;
  relatedMatchID?: number;
  relatedApplicantID?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private apiUrl = 'http://localhost:5000/api/notifications';
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    // Note: Polling is handled by the component with actual userId
  }

  getUserNotifications(userId: number, unreadOnly: boolean = false, limit: number = 50): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/user/${userId}?unreadOnly=${unreadOnly}&limit=${limit}`)
      .pipe(
        map(notifications => notifications.map(n => ({
          ...n,
          createdAt: new Date(n.createdAt),
          readAt: n.readAt ? new Date(n.readAt) : undefined
        })))
      );
  }

  getUnreadCount(userId: number): Observable<number> {
    return this.http.get<{ unreadCount: number }>(`${this.apiUrl}/unread-count/${userId}`)
      .pipe(
        map(response => {
          this.unreadCountSubject.next(response.unreadCount);
          return response.unreadCount;
        })
      );
  }

  createNotification(notification: CreateNotification): Observable<Notification> {
    return this.http.post<Notification>(`${this.apiUrl}`, notification);
  }

  markAsRead(notificationId: number, userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${notificationId}/read?userId=${userId}`, {});
  }

  markAllAsRead(userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/mark-all-read/${userId}`, {});
  }

  deleteNotification(notificationId: number, userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${notificationId}?userId=${userId}`);
  }

  updateUnreadCount(userId: number): void {
    this.getUnreadCount(userId).subscribe();
  }
}

