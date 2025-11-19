import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GetDatabyDatasourceService } from '../../../services/get-data/get-databy-datasource.service';
import { isPlatformBrowser } from '@angular/common';
import { ChatService, ChatMessage } from '../../../services/chat.service';
import { AuthService } from '../../../services/auth/auth.service';
import { Subscription } from 'rxjs';

// Import from parent component which already has the correct types
export interface MatchRequest {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  roles: string;
  numPlayers: number;
  price: number;
  organizer: string;
  organizerId: number;
  isOwn?: boolean;
}

export interface Applicant {
  id: number;
  userName: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
  userId: number;
  acceptedAt?: string;
}

export interface MyRequest extends MatchRequest {
  applicants: Applicant[];
}

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-requests.component.html',
  styleUrls: ['./my-requests.component.css']
})
export class MyRequestsComponent implements OnInit, OnDestroy {
  @Input() requests: MyRequest[] = [];
  @Output() applicantStatusChanged = new EventEmitter<{ requestId: number; applicantId: number; status: 'accepted' | 'rejected' }>();

  showChat = false;
  currentChatMatchId: number = 0;
  currentChatApplicant: Applicant | null = null;
  currentChatRequest: MyRequest | null = null;
  chatMessages: ChatMessage[] = [];
  chatInput = '';
  userId: any;
  currentUserName: string = '';
  private chatSubscription?: Subscription;
  private messagePollingSubscription?: Subscription;

constructor(
  private getDataService: GetDatabyDatasourceService,
    private chatService: ChatService,
    private authService: AuthService,
  @Inject(PLATFORM_ID) private platformId: Object
) {}

ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('loggedInUser');
      if (saved) {
        try {
          const user = JSON.parse(saved);
          this.userId = user.userID ?? 0;
          this.currentUserName = user.fullName ?? '';
        } catch (err) {
          // Failed to parse loggedInUser
        }
      }
    }
  }

  ngOnDestroy(): void {
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
    if (this.messagePollingSubscription) {
      this.messagePollingSubscription.unsubscribe();
    }
}


  acceptApplicant(request: MyRequest, applicant: Applicant): void {
    this.applicantStatusChanged.emit({
      requestId: request.id,
      applicantId: applicant.id,
      status: 'accepted'
    });
  }

  rejectApplicant(request: MyRequest, applicant: Applicant): void {
    this.applicantStatusChanged.emit({
      requestId: request.id,
      applicantId: applicant.id,
      status: 'rejected'
    });
  }

  // Check if chat is available for an applicant
  isChatAvailable(request: MyRequest, applicant: Applicant): boolean {
    if (applicant.status !== 'accepted') {
      return false;
    }
    
    // Check if current time is before match end time
    return this.chatService.isChatAvailable(
      request.date,
      request.endTime,
      applicant.acceptedAt
    );
  }

  startChat(request: MyRequest, applicant: Applicant): void {
    if (!this.isChatAvailable(request, applicant)) {
      return;
    }

    this.currentChatMatchId = request.id;
    this.currentChatApplicant = applicant;
    this.currentChatRequest = request;
    this.showChat = true;
    this.chatMessages = [];

    // Load existing messages
    this.loadMessages();

    // Start polling for new messages
    this.startMessagePolling();
  }

  closeChat(): void {
    this.showChat = false;
    this.chatMessages = [];
    this.chatInput = '';
    this.currentChatApplicant = null;
    this.currentChatRequest = null;
    this.currentChatMatchId = 0;

    // Stop polling
    if (this.messagePollingSubscription) {
      this.messagePollingSubscription.unsubscribe();
    }
  }

  loadMessages(): void {
    if (!this.currentChatRequest || !this.currentChatApplicant || !this.userId) {
      return;
    }

    // Ensure applicant userId is valid
    if (!this.currentChatApplicant.userId || this.currentChatApplicant.userId <= 0) {
      return;
    }

    this.chatService.getMessages(
      this.currentChatRequest.id,
      this.userId,
      this.currentChatApplicant.userId
    ).subscribe({
      next: (messages) => {
        this.chatMessages = messages.sort((a, b) => {
          const timeA = new Date(a.timestamp || a.createdAt || '').getTime();
          const timeB = new Date(b.timestamp || b.createdAt || '').getTime();
          return timeA - timeB;
        });
      },
      error: (err) => {
        // Error loading messages
      }
    });
  }

  startMessagePolling(): void {
    if (!this.currentChatRequest || !this.currentChatApplicant || !this.userId) {
      return;
    }

    // Ensure applicant userId is valid
    if (!this.currentChatApplicant.userId || this.currentChatApplicant.userId <= 0) {
      return;
    }

    // Poll every 3 seconds for new messages
    this.messagePollingSubscription = this.chatService.getMessagesWithPolling(
      this.currentChatRequest.id,
      this.userId,
      this.currentChatApplicant.userId,
      3000
    ).subscribe({
      next: (messages) => {
        this.chatMessages = messages.sort((a, b) => {
          const timeA = new Date(a.timestamp || a.createdAt || '').getTime();
          const timeB = new Date(b.timestamp || b.createdAt || '').getTime();
          return timeA - timeB;
        });
      },
      error: (err) => {
        // Error polling messages
      }
    });
  }

  sendMessage(): void {
    const text = this.chatInput.trim();
    if (!text || !this.currentChatRequest || !this.currentChatApplicant || !this.userId) {
      return;
    }

    // Ensure applicant userId is valid
    if (!this.currentChatApplicant.userId || this.currentChatApplicant.userId <= 0) {
      return;
    }

    // Check if chat is still available
    if (!this.isChatAvailable(this.currentChatRequest, this.currentChatApplicant)) {
      this.closeChat();
      return;
    }

    const message: ChatMessage = {
      matchId: this.currentChatRequest.id,
      senderId: this.userId,
      senderName: this.currentUserName,
      receiverId: this.currentChatApplicant.userId,
      receiverName: this.currentChatApplicant.userName,
      message: text,
      timestamp: new Date().toISOString()
    };

    this.chatService.sendMessage(message).subscribe({
      next: (sentMessage) => {
        this.chatMessages.push(sentMessage);
    this.chatInput = '';
      },
      error: (err) => {
        // Error sending message
      }
    });
  }

  handleChatKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Check if message is from current user
  isMyMessage(message: ChatMessage): boolean {
    return message.senderId === this.userId;
  }

  formatMessageTime(timestamp?: string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    const [hoursStr, minutes] = timeString.split(':');
    let hour = parseInt(hoursStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  getApplicantCount(request: MyRequest): string {
    const count = request.applicants?.length || 0;
    if (count === 0) return 'No Applicants';
    return `${count} Applicant${count > 1 ? 's' : ''}`;
  }
}