import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactMessage {
    messageId: number;
    fullName: string;
    email: string;
    phoneNumber?: string;
    category: string;
    subject: string;
    message: string;
    attachmentPath?: string;
    status: string;
    priority: string;
    createdAt: Date;
    resolvedAt?: Date;
}

@Injectable({
    providedIn: 'root'
})
export class ContactService {
    private apiUrl = 'http://localhost:5000/api/Contact';

    constructor(private http: HttpClient) { }

    getMessages(status?: string, category?: string): Observable<ContactMessage[]> {
        let url = `${this.apiUrl}/messages`;
        const params: string[] = [];

        if (status) params.push(`status=${status}`);
        if (category) params.push(`category=${category}`);

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        return this.http.get<ContactMessage[]>(url);
    }

    updateMessageStatus(messageId: number, status: string, adminNotes?: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/${messageId}/status`, {
            status,
            adminNotes
        });
    }
}
