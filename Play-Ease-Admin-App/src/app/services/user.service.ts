import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = 'http://localhost:5000/api'; // 🔗 your backend base URL

  constructor(private http: HttpClient) {}

  // ✅ Register
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login/register`, userData);
  }

  // ✅ Login
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login/login`, credentials);
  }

  // ✅ (Optional) Get all users if you add UsersController later
  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`);
  }
}
