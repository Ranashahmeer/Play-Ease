import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GetDatabyDatasourceService } from '../../../services/get-data/get-databy-datasource.service';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { ChatService, ChatMessage } from '../../../services/chat.service';
import { MatchService, Applicant } from '../../../services/match.service';
import { AlertService } from '../../../services/alert.service';
import { Subscription } from 'rxjs';


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
  applicants?: Applicant[]; // Applicants are included from parent component
}

@Component({
  selector: 'app-available-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './available-requests.component.html',
  styleUrls: ['./available-requests.component.css']
})
export class AvailableRequestsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() requests: MatchRequest[] = [];
 @Output() applicationSubmitted = new EventEmitter<{
  matchId: number;
  userId: number;
  userName: string;
  role: string;
}>();

  showRoleModal = false;
  selectedMatch: MatchRequest | null = null;
  availableRoles: string[] = [];
  appliedRequests = new Set<number>();
  showNotification = false;
  notificationText = '';
  userId!: number;
  fullname: any;
  
  // Chat functionality
  showChat = false;
  currentChatRequest: MatchRequest | null = null;
  currentChatOrganizerId: number = 0;
  currentChatOrganizerName: string = '';
  chatMessages: ChatMessage[] = [];
  chatInput = '';
  acceptedApplicants: Map<number, Applicant> = new Map(); // matchId -> Applicant
  private messagePollingSubscription?: Subscription;

  constructor(
    private getDataService: GetDatabyDatasourceService,
    private chatService: ChatService,
    private matchService: MatchService,
    private alertService: AlertService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('loggedInUser');
      if (saved) {
        try {
          const user = JSON.parse(saved);
          this.userId = user.userID ?? 0;
          this.fullname = user.fullName ?? '';
        } catch (err) {
          // Failed to parse loggedInUser
        }
      }
      
      // Process applicants from requests (already loaded from parent)
      this.processAcceptedApplicants();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Refresh accepted applicants when requests input changes
    if (changes['requests']) {
      this.processAcceptedApplicants();
      // Update appliedRequests Set based on actual applicants data
      this.updateAppliedRequests();
    }
  }

  // Update appliedRequests Set based on actual applicants data
  private updateAppliedRequests(): void {
    if (!this.userId) return;
    
    this.requests.forEach(request => {
      if (request.applicants && request.applicants.some((a: Applicant) => a.userId === this.userId)) {
        this.appliedRequests.add(request.id);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.messagePollingSubscription) {
      this.messagePollingSubscription.unsubscribe();
    }
  }

  // Process accepted applicants from requests data (no API call needed)
  processAcceptedApplicants(): void {
    if (!this.userId) return;

    // Clear existing map
    this.acceptedApplicants.clear();

    // Process applicants from each request (already loaded from parent component)
    this.requests.forEach(request => {
      if (request.applicants && Array.isArray(request.applicants)) {
        const acceptedApplicant = request.applicants.find(
          (a: Applicant) => a.userId === this.userId && a.status === 'accepted'
        );
        if (acceptedApplicant) {
          this.acceptedApplicants.set(request.id, acceptedApplicant);
        }
      }
    });
  }

  // Method to refresh accepted applicants (call when requests change)
  refreshAcceptedApplicants(): void {
    this.processAcceptedApplicants();
  }

  // Check if user is accepted applicant for a request
  isAcceptedApplicant(requestId: number): boolean {
    return this.acceptedApplicants.has(requestId);
  }

  // Get accepted applicant info for a request
  getAcceptedApplicant(requestId: number): Applicant | undefined {
    return this.acceptedApplicants.get(requestId);
  }

  // Check if chat is available for a request
  isChatAvailable(request: MatchRequest): boolean {
    if (!this.isAcceptedApplicant(request.id)) {
      return false;
    }

    const applicant = this.getAcceptedApplicant(request.id);
    if (!applicant) {
      return false;
    }

    return this.chatService.isChatAvailable(
      request.date,
      request.endTime,
      applicant.acceptedAt
    );
  }

  startChat(request: MatchRequest): void {
    if (!this.isChatAvailable(request)) {
      return;
    }

    this.currentChatRequest = request;
    this.currentChatOrganizerId = request.organizerId;
    this.currentChatOrganizerName = request.organizer;
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
    this.currentChatRequest = null;
    this.currentChatOrganizerId = 0;
    this.currentChatOrganizerName = '';

    // Stop polling
    if (this.messagePollingSubscription) {
      this.messagePollingSubscription.unsubscribe();
    }
  }

  loadMessages(): void {
    if (!this.currentChatRequest || !this.userId) {
      return;
    }

    this.chatService.getMessages(
      this.currentChatRequest.id,
      this.userId,
      this.currentChatOrganizerId
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
    if (!this.currentChatRequest || !this.userId) {
      return;
    }

    // Poll every 3 seconds for new messages
    this.messagePollingSubscription = this.chatService.getMessagesWithPolling(
      this.currentChatRequest.id,
      this.userId,
      this.currentChatOrganizerId,
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
    if (!text || !this.currentChatRequest || !this.userId) {
      return;
    }

    // Check if chat is still available
    if (!this.isChatAvailable(this.currentChatRequest)) {
      this.closeChat();
      return;
    }

    const message: ChatMessage = {
      matchId: this.currentChatRequest.id,
      senderId: this.userId,
      senderName: this.fullname,
      receiverId: this.currentChatOrganizerId,
      receiverName: this.currentChatOrganizerName,
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

  applyToRequest(request: MatchRequest): void {
    this.selectedMatch = request;
    this.availableRoles = request.roles.split(',').map(r => r.trim());
    this.showRoleModal = true;
  }

  closeRoleModal(): void {
    this.showRoleModal = false;
    this.selectedMatch = null;
    this.availableRoles = [];
  }

  selectRole(role: string): void {
    if (this.selectedMatch) {
      // Check if already applied using actual applicants data
      if (this.isAlreadyApplied(this.selectedMatch.id)) {
        this.alertService.warning('You have already applied to this match.');
        this.closeRoleModal();
        return;
      }

      this.appliedRequests.add(this.selectedMatch.id);
      this.applicationSubmitted.emit({
        matchId: this.selectedMatch.id,
        userId: this.userId,
        userName: this.fullname,
        role: role
      });

      this.closeRoleModal();
      this.displayNotification(`Application submitted for ${role} position!`);
    }
  }

  // Check if user has already applied to a request (using actual applicants data)
  isAlreadyApplied(requestId: number): boolean {
    if (!this.userId) return false;
    
    const request = this.requests.find(r => r.id === requestId);
    if (!request || !request.applicants) return false;
    
    return request.applicants.some((a: Applicant) => a.userId === this.userId);
  }

  // Check if user has applied (for UI display)
  isApplied(requestId: number): boolean {
    // Check both local Set (for immediate feedback) and actual applicants data
    return this.appliedRequests.has(requestId) || this.isAlreadyApplied(requestId);
  }

  // Get applicant status for a request
  getApplicantStatus(requestId: number): 'pending' | 'accepted' | 'rejected' | null {
    if (!this.userId) return null;
    
    const request = this.requests.find(r => r.id === requestId);
    if (!request || !request.applicants) return null;
    
    const applicant = request.applicants.find((a: Applicant) => a.userId === this.userId);
    return applicant ? applicant.status : null;
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

  // Get remaining slots for a request
  getRemainingSlots(request: MatchRequest): number {
    const numPlayers = request.numPlayers || 0;
    const acceptedCount = request.applicants?.filter(
      (a: Applicant) => a.status === 'accepted'
    ).length || 0;
    return Math.max(0, numPlayers - acceptedCount);
  }

  // Check if request is fully booked
  isFullyBooked(request: MatchRequest): boolean {
    return this.getRemainingSlots(request) === 0;
  }

  private displayNotification(message: string): void {
    this.notificationText = message;
    this.showNotification = true;
    setTimeout(() => {
      this.showNotification = false;
    }, 3000);
  }
}