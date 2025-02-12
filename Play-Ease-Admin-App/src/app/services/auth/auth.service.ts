import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://localhost:7267/api/Login/authenticate'; // Update with your actual API URL
  
  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }): Observable<{ userId: number; username: string }> {
    return this.http.post<{ userId: number; username: string }>(this.apiUrl, credentials);
}
}
