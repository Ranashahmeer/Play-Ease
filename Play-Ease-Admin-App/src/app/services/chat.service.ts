import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

export interface ChatMessage {
  id?: number;
  matchId: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  message: string;
  timestamp: string;
  createdAt?: string;
}

export interface ChatConversation {
  matchId: number;
  participantId: number;
  participantName: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = "http://localhost:5000/api";

  constructor(private http: HttpClient) {}

  // Send a message
  sendMessage(message: ChatMessage): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.apiUrl}/Chat/send`, message);
  }

  // Get messages for a specific match conversation
  getMessages(matchId: number, userId1: number, userId2: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(
      `${this.apiUrl}/Chat/messages/${matchId}?userId1=${userId1}&userId2=${userId2}`
    );
  }

  // Get messages with polling (auto-refresh)
  getMessagesWithPolling(matchId: number, userId1: number, userId2: number, intervalMs: number = 3000): Observable<ChatMessage[]> {
    return interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.getMessages(matchId, userId1, userId2))
    );
  }

  // Get all conversations for a user
  getConversations(userId: number): Observable<ChatConversation[]> {
    return this.http.get<ChatConversation[]>(`${this.apiUrl}/Chat/conversations/${userId}`);
  }

  // Check if chat is available (between acceptance and match end time)
  isChatAvailable(matchDate: string, matchEndTime: string, applicantAcceptedAt?: string): boolean {
    try {
      const now = new Date();
      
      // Extract HH:MM from database time format (e.g., "12:00:00.0000000" -> "12:00")
      const extractTime = (timeStr: string): { hours: number; minutes: number } => {
        if (!timeStr) return { hours: 0, minutes: 0 };
        const parts = timeStr.split(':');
        if (parts.length >= 2) {
          return {
            hours: parseInt(parts[0], 10) || 0,
            minutes: parseInt(parts[1], 10) || 0
          };
        }
        return { hours: 0, minutes: 0 };
      };
      
      // Parse match date and end time
      const { hours, minutes } = extractTime(matchEndTime);
      const matchDateTime = new Date(matchDate);
      matchDateTime.setHours(hours, minutes, 0, 0);
      
      // Chat is not available if match has ended
      if (now > matchDateTime) {
        return false;
      }

      // If acceptance time is provided, chat is only available between acceptance time and match end time
      if (applicantAcceptedAt) {
        const acceptedAt = new Date(applicantAcceptedAt);
        // Chat must be after acceptance AND before match end
        return now >= acceptedAt && now <= matchDateTime;
      }

      // If no acceptance time provided (for organizer), chat is available until match ends
      return now <= matchDateTime;
    } catch (error) {
      console.error('Error checking chat availability:', error);
      return false;
    }
  }
}

