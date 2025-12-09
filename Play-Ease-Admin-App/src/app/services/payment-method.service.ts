import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaymentMethod {
    methodID: number;
    methodName: string;
}

export interface OwnerPaymentMethod {
    paymentID?: number;
    ownerID: number;
    methodID: number;
    methodName?: string;
    accountTitle: string;
    accountNumber: string;
    bankName?: string;
}

export interface CreateOwnerPaymentDto {
    ownerID: number;
    methodID: number;
    accountTitle: string;
    accountNumber: string;
    bankName?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PaymentMethodService {
    private apiUrl = 'http://localhost:5000/api/PaymentMethods';

    constructor(private http: HttpClient) { }

    getPaymentMethods(): Observable<PaymentMethod[]> {
        return this.http.get<PaymentMethod[]>(this.apiUrl);
    }

    getOwnerPaymentMethods(ownerId: number): Observable<OwnerPaymentMethod[]> {
        return this.http.get<OwnerPaymentMethod[]>(`${this.apiUrl}/owner/${ownerId}`);
    }

    createOwnerPayment(payment: CreateOwnerPaymentDto): Observable<any> {
        return this.http.post(`${this.apiUrl}/owner-payment`, payment);
    }

    createOwnerPaymentsBulk(payments: CreateOwnerPaymentDto[]): Observable<any> {
        return this.http.post(`${this.apiUrl}/owner-payment-bulk`, payments);
    }

    deleteOwnerPayment(paymentId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/owner-payment/${paymentId}`);
    }
}
