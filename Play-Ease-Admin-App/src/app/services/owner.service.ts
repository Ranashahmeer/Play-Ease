import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:5000/api';

export interface RegisterOwnerDto {
    fullName: string;
    email: string;
    phone: string;
    cnic: string;
    password: string;
    age?: number;
}

export interface UpdateOwnerDto {
    fullName?: string;
    email?: string;
    phone?: string;
    cnic?: string;
    age?: number;
}

export interface Owner {
    ownerID: number;
    userID: number;
    fullName: string;
    email: string;
    phone: string;
    cnic: string;
    age?: number;
    createdAt: string;
    isActive: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class OwnerService {
    private apiUrl = API_URL;

    constructor(private http: HttpClient) { }

    registerOwner(dto: RegisterOwnerDto): Observable<any> {
        return this.http.post(`${this.apiUrl}/Owner/register`, dto);
    }

    getOwners(): Observable<Owner[]> {
        return this.http.get<Owner[]>(`${this.apiUrl}/Owner/list`);
    }

    getOwner(id: number): Observable<Owner> {
        return this.http.get<Owner>(`${this.apiUrl}/Owner/${id}`);
    }

    updateOwner(id: number, dto: UpdateOwnerDto): Observable<any> {
        return this.http.put(`${this.apiUrl}/Owner/${id}`, dto);
    }

    checkEmailExists(email: string): Observable<{ exists: boolean }> {
        return this.http.get<{ exists: boolean }>(`${this.apiUrl}/Owner/check-email/${email}`);
    }
}
