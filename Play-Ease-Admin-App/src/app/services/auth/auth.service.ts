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
setUser(data: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem("loggedInUser", JSON.stringify(data));
  }
}


  // ✅ Get current user
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  // ✅ Get user ID from loggedInUser JSON
  getUserId(): number {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('loggedInUser');
      if (saved) {
        try {
          const user = JSON.parse(saved);
          // Handle different possible field names
          return user.userID ?? user.userId ?? user.id ?? 0;
        } catch (err) {
          return 0;
        }
      }
    }
    return 0;  // server-side rendering fallback
  }

  // ✅ Get user name from loggedInUser JSON
  getUserName(): string {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('loggedInUser');
      if (saved) {
        try {
          const user = JSON.parse(saved);
          // Handle different possible field names
          return user.fullName ?? user.fullname ?? user.name ?? user.userName ?? "";
        } catch (err) {
          return "";
        }
      }
    }
    return "";
  }

  // ✅ Check if user is logged in
  isLoggedIn(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('loggedInUser');
    }
    return false;
  }

  // ✅ Logout
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('loggedInUser');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
    }
  }
}