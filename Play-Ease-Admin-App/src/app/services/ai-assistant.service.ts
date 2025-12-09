import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface ChatMessage {
    id: string;
    message: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    type?: 'faq' | 'court_search' | 'general';
    courts?: CourtSummary[];
}

export interface CourtSummary {
    courtId: number;
    name: string;
    location: string;
    sport: string;
    pricePerHour: number;
    rating: number;
}

export interface ChatResponse {
    reply: string;
    type: string;
    courts?: CourtSummary[];
    timestamp: string;
}

@Injectable({
    providedIn: 'root'
})
export class AiAssistantService {
    private apiUrl = 'http://localhost:5000/api/AIAssistant';
    private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
    public messages$ = this.messagesSubject.asObservable();

    private isTypingSubject = new BehaviorSubject<boolean>(false);
    public isTyping$ = this.isTypingSubject.asObservable();

    constructor(private http: HttpClient) {
        this.initializeChat();
    }

    private initializeChat(): void {
        const welcomeMessage: ChatMessage = {
            id: this.generateId(),
            message: "Hi! I'm your Play-Ease AI assistant. I can help you find courts, answer questions about booking, and more! How can I help you today?",
            sender: 'ai',
            timestamp: new Date(),
            type: 'general'
        };
        this.messagesSubject.next([welcomeMessage]);
    }

    sendMessage(message: string, userId?: number): Observable<ChatResponse> {
        // Add user message immediately
        const userMessage: ChatMessage = {
            id: this.generateId(),
            message: message,
            sender: 'user',
            timestamp: new Date()
        };

        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, userMessage]);

        // Show typing indicator
        this.isTypingSubject.next(true);

        return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, {
            message: message,
            userId: userId
        }).pipe(
            tap(response => {
                // Hide typing indicator
                this.isTypingSubject.next(false);

                // Add AI response
                const aiMessage: ChatMessage = {
                    id: this.generateId(),
                    message: response.reply,
                    sender: 'ai',
                    timestamp: new Date(response.timestamp),
                    type: response.type as any,
                    courts: response.courts
                };

                const messages = this.messagesSubject.value;
                this.messagesSubject.next([...messages, aiMessage]);
            })
        );
    }

    getSuggestions(): Observable<{ suggestions: string[] }> {
        return this.http.get<{ suggestions: string[] }>(`${this.apiUrl}/suggestions`);
    }

    clearChat(): void {
        this.initializeChat();
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
