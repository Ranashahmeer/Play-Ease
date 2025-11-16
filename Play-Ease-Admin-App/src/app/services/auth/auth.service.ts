// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  userID: number;
  fullName: string;
  email: string;
  roleID: number;
  // Add other user properties as needed
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:5000/api/Login';

  constructor(private http: HttpClient) {}

  register(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, user);
  }

  login(payload: { email: string; password: string; role: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, payload).pipe(
      tap((response: any) => {
        // Store user info after successful login
        if (response && response.user) {
          this.setUser(response.user);
        }
      })
    );
  }

  // ✅ Store user info in localStorage
  setUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('userId', user.userID.toString());
    localStorage.setItem('userName', user.fullName);
  }

  // ✅ Get current user
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  // ✅ Get user ID
  getUserId(): number {
    return parseInt(localStorage.getItem('userId') || '0');
  }

  // ✅ Get user name
  getUserName(): string {
    return localStorage.getItem('userName') || '';
  }

  // ✅ Check if user is logged in
  isLoggedIn(): boolean {
    return !!localStorage.getItem('currentUser');
  }

  // ✅ Logout
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
  }
}