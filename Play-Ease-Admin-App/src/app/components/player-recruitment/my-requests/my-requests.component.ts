import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GetDatabyDatasourceService } from '../../../services/get-data/get-databy-datasource.service';
import { isPlatformBrowser } from '@angular/common';
import { ChatService, ChatMessage } from '../../../services/chat.service';
import { AuthService } from '../../../services/auth/auth.service';
import { PlayerRatingComponent } from '../../player-rating/player-rating.component';
import { UserRatingBadgeComponent } from '../../user-rating-badge/user-rating-badge.component';
import { MatchService } from '../../../services/match.service';
import { AlertService } from '../../../services/alert.service';
import { NotificationsService } from '../../../services/notifications/notifications.service';
import { Subscription, interval } from 'rxjs';
import { startWith } from 'rxjs/operators';

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
  imports: [CommonModule, FormsModule, PlayerRatingComponent, UserRatingBadgeComponent],
  templateUrl: './my-requests.component.html',
  styleUrls: ['./my-requests.component.css']
})
export class MyRequestsComponent implements OnInit, OnDestroy {
  @Input() requests: MyRequest[] = [];
  @Output() applicantStatusChanged = new EventEmitter<{ requestId: number; applicantId: number; status: 'accepted' | 'rejected' }>();

  showChat = false;
  chatMinimized = false;
  currentChatMatchId: number = 0;
  currentChatApplicant: Applicant | null = null;
  currentChatRequest: MyRequest | null = null;
  chatMessages: ChatMessage[] = [];
  chatInput = '';
  userId: any;
  currentUserName: string = '';
  private chatSubscription?: Subscription;
  private messagePollingSubscription?: Subscription;
  private unreadCountPollingSubscription?: Subscription;

  // Unread message tracking
  unreadCounts: Map<string, number> = new Map();

  // Chat dragging
  chatPosition = { x: window.innerWidth - 370, y: 80 }; // Start position (top-right)
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };

  constructor(
    private getDataService: GetDatabyDatasourceService,
    private chatService: ChatService,
    private authService: AuthService,
    private matchService: MatchService,
    private alertService: AlertService,
    private notificationsService: NotificationsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('loggedInUser');
      if (saved) {
        try {
          const user = JSON.parse(saved);
          this.userId = user.userID ?? 0;
          this.currentUserName = user.fullName ?? '';

          // Start polling for unread counts
          this.startUnreadCountPolling();
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
    if (this.unreadCountPollingSubscription) {
      this.unreadCountPollingSubscription.unsubscribe();
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

    // Mark messages as read
    if (this.userId && applicant.userId) {
      const conversationKey = `${request.id}-${applicant.userId}`;

      this.chatService.markAsRead(request.id, this.userId, applicant.userId).subscribe({
        next: () => {
          // Reset unread count for this conversation
          this.unreadCounts.set(conversationKey, 0);
        },
        error: (err) => {
          console.error('Error marking messages as read:', err);
        }
      });
    }

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
    // If chatting with organizer (accepted applicant), use different method
    if (!this.currentChatApplicant && this.currentChatRequest) {
      this.sendMessageToOrganizer();
      return;
    }

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

  // Get remaining slots for a request
  getRemainingSlots(request: MyRequest): number {
    const numPlayers = request.numPlayers || 0;
    const acceptedCount = request.applicants?.filter(
      (a: Applicant) => a.status === 'accepted'
    ).length || 0;
    return Math.max(0, numPlayers - acceptedCount);
  }

  // Check if request is fully booked
  isFullyBooked(request: MyRequest): boolean {
    return this.getRemainingSlots(request) === 0;
  }

  // Helper method to extract time from time string
  private extractTime(timeStr: string): string {
    if (!timeStr) return '00:00:00';
    // If already in HH:MM:SS format
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      if (parts.length === 2) return `${parts[0]}:${parts[1]}:00`;
      return timeStr;
    }
    return '00:00:00';
  }

  // Get match start date-time
  getMatchStartDateTime(request: MyRequest): Date | null {
    if (!request.date || !request.startTime) return null;
    try {
      const dateStr = request.date.includes('T') ? request.date.split('T')[0] : request.date;
      const timeStr = this.extractTime(request.startTime);
      return new Date(`${dateStr}T${timeStr}`);
    } catch {
      return null;
    }
  }

  // Get match end date-time
  getMatchEndDateTime(request: MyRequest): Date | null {
    if (!request.date || !request.endTime) return null;
    try {
      const dateStr = request.date.includes('T') ? request.date.split('T')[0] : request.date;
      const timeStr = this.extractTime(request.endTime);
      return new Date(`${dateStr}T${timeStr}`);
    } catch {
      return null;
    }
  }

  // Check if match has started
  hasMatchStarted(request: MyRequest): boolean {
    const startTime = this.getMatchStartDateTime(request);
    if (!startTime) return false;
    return new Date() >= startTime;
  }

  // Get time until match starts (in minutes)
  getTimeUntilStart(request: MyRequest): number {
    const startTime = this.getMatchStartDateTime(request);
    if (!startTime) return -1;
    const now = new Date();
    const diffMs = startTime.getTime() - now.getTime();
    return Math.floor(diffMs / 60000); // Convert to minutes
  }

  // Check if match is starting soon (within 2 hours)
  isMatchStartingSoon(request: MyRequest): boolean {
    const minutesUntilStart = this.getTimeUntilStart(request);
    return minutesUntilStart > 0 && minutesUntilStart <= 120;
  }

  // Format time until start
  formatTimeUntilStart(request: MyRequest): string {
    const minutes = this.getTimeUntilStart(request);
    if (minutes < 0) return 'Started';
    if (minutes === 0) return 'Starting now';
    if (minutes < 60) return `Starts in ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    if (hours < 24) {
      return remainingMins > 0 ? `Starts in ${hours}h ${remainingMins}m` : `Starts in ${hours}h`;
    }
    const days = Math.floor(hours / 24);
    return `Starts in ${days}d`;
  }

  // Check if this request is owned by the current user
  isOwnRequest(request: MyRequest): boolean {
    return request.organizerId === this.userId;
  }

  // Check if user is an accepted applicant for this request
  isAcceptedApplicant(request: MyRequest): boolean {
    if (!this.userId || !request.applicants) return false;
    return request.applicants.some(
      (a: Applicant) => a.userId === this.userId && a.status === 'accepted'
    );
  }

  // Get the user's applicant info for this request
  getMyApplicantInfo(request: MyRequest): Applicant | null {
    if (!this.userId || !request.applicants) return null;
    return request.applicants.find(
      (a: Applicant) => a.userId === this.userId && a.status === 'accepted'
    ) || null;
  }

  // Start chat with organizer (for accepted applicants)
  startChatWithOrganizer(request: MyRequest): void {
    const myApplicant = this.getMyApplicantInfo(request);
    if (!myApplicant) return;

    // Check if chat is available
    if (!this.chatService.isChatAvailable(request.date, request.endTime, myApplicant.acceptedAt)) {
      return;
    }

    this.currentChatMatchId = request.id;
    this.currentChatRequest = request;
    // For accepted applicant chatting with organizer, we set applicant to null and use organizer info
    this.currentChatApplicant = null;
    this.showChat = true;
    this.chatMessages = [];

    // Load existing messages with organizer
    this.loadMessagesWithOrganizer();

    // Start polling for new messages
    this.startMessagePollingWithOrganizer();
  }

  // Load messages with organizer
  loadMessagesWithOrganizer(): void {
    if (!this.currentChatRequest || !this.userId) {
      return;
    }

    this.chatService.getMessages(
      this.currentChatRequest.id,
      this.userId,
      this.currentChatRequest.organizerId
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

  // Start polling for messages with organizer
  startMessagePollingWithOrganizer(): void {
    if (!this.currentChatRequest || !this.userId) {
      return;
    }

    // Poll every 3 seconds for new messages
    this.messagePollingSubscription = this.chatService.getMessagesWithPolling(
      this.currentChatRequest.id,
      this.userId,
      this.currentChatRequest.organizerId,
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

  // Check if chat is available with organizer
  isChatAvailableWithOrganizer(request: MyRequest): boolean {
    const myApplicant = this.getMyApplicantInfo(request);
    if (!myApplicant) return false;

    return this.chatService.isChatAvailable(
      request.date,
      request.endTime,
      myApplicant.acceptedAt
    );
  }

  // Get accepted applicants for a request (for organizer view)
  getAcceptedApplicants(request: MyRequest): Applicant[] {
    if (!request.applicants) return [];
    return request.applicants.filter((a: Applicant) => a.status === 'accepted');
  }

  // Check if request has accepted applicants (for organizer view)
  hasAcceptedApplicants(request: MyRequest): boolean {
    return this.getAcceptedApplicants(request).length > 0;
  }

  // Check if match is completed (end time has passed)
  isMatchCompleted(request: MyRequest): boolean {
    if (!request.date || !request.endTime) return false;

    const matchDateTime = new Date(`${request.date}T${request.endTime}`);
    const now = new Date();

    return now > matchDateTime;
  }

  // Check if user can rate players (match completed and user was accepted)
  canRatePlayers(request: MyRequest): boolean {
    if (!this.isMatchCompleted(request)) return false;

    // User must be either organizer or accepted applicant
    return this.isOwnRequest(request) || this.isAcceptedApplicant(request);
  }

  // Send message to organizer (for accepted applicants)
  sendMessageToOrganizer(): void {
    const text = this.chatInput.trim();
    if (!text || !this.currentChatRequest || !this.userId) {
      return;
    }

    // Check if chat is still available
    if (!this.isChatAvailableWithOrganizer(this.currentChatRequest)) {
      this.closeChat();
      return;
    }

    const message: ChatMessage = {
      matchId: this.currentChatRequest.id,
      senderId: this.userId,
      senderName: this.currentUserName,
      receiverId: this.currentChatRequest.organizerId,
      receiverName: this.currentChatRequest.organizer,
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

  // Delete/Cancel match (organizer only)
  deleteMatch(request: MyRequest): void {
    // Check if match has already started
    if (this.hasMatchStarted(request)) {
      this.alertService.error('Cannot delete a match that has already started.');
      return;
    }

    const acceptedCount = request.applicants?.filter(a => a.status === 'accepted').length || 0;
    const confirmMessage = acceptedCount > 0
      ? `Are you sure you want to delete this match?\n\n${acceptedCount} accepted player(s) will be notified of the cancellation.`
      : 'Are you sure you want to delete this match?';

    if (!confirm(confirmMessage)) {
      return;
    }

    this.matchService.cancelMatch(request.id, this.userId).subscribe({
      next: () => {
        this.alertService.success('Match deleted successfully!' + (acceptedCount > 0 ? ' All accepted applicants have been notified.' : ''));
        // Refresh notifications
        if (this.userId) {
          this.notificationsService.updateUnreadCount(this.userId);
        }
        // Emit event to refresh data
        this.applicantStatusChanged.emit({ requestId: request.id, applicantId: 0, status: 'cancelled' as any });
      },
      error: (err) => {
        this.alertService.error(err.error?.message || 'Failed to delete match. Please try again.');
      }
    });
  }

  // Withdraw application (applicant only)
  withdrawApplication(request: MyRequest): void {
    // Check if match has already started
    if (this.hasMatchStarted(request)) {
      this.alertService.error('Cannot withdraw from a match that has already started.');
      return;
    }

    const confirmMessage = 'Are you sure you want to withdraw your application?\n\nThe organizer will be notified.';

    if (!confirm(confirmMessage)) {
      return;
    }

    this.matchService.withdrawApplication(request.id, this.userId).subscribe({
      next: () => {
        this.alertService.success('Application withdrawn successfully! The organizer has been notified.');
        // Refresh notifications
        if (this.userId) {
          this.notificationsService.updateUnreadCount(this.userId);
        }
        // Emit event to refresh data
        this.applicantStatusChanged.emit({ requestId: request.id, applicantId: 0, status: 'withdrawn' as any });
      },
      error: (err) => {
        this.alertService.error(err.error?.message || 'Failed to withdraw application. Please try again.');
      }
    });
  }

  // Check if match can be deleted/cancelled (not started)
  canDeleteMatch(request: MyRequest): boolean {
    return !this.hasMatchStarted(request);
  }

  // Chat dragging functionality
  startDragging(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('.chat-controls, .btn-close, .btn-minimize')) {
      return; // Don't drag when clicking controls
    }

    this.isDragging = true;
    this.dragOffset.x = event.clientX - this.chatPosition.x;
    this.dragOffset.y = event.clientY - this.chatPosition.y;

    event.preventDefault();

    // Add global mouse move and mouse up listeners
    const mouseMoveHandler = (e: MouseEvent) => this.onDrag(e);
    const mouseUpHandler = () => this.stopDragging(mouseMoveHandler, mouseUpHandler);

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  }

  private onDrag(event: MouseEvent): void {
    if (!this.isDragging) return;

    let newX = event.clientX - this.dragOffset.x;
    let newY = event.clientY - this.dragOffset.y;

    // Keep chat within viewport bounds
    const chatWidth = 350;
    const chatHeight = this.chatMinimized ? 60 : 500;

    newX = Math.max(0, Math.min(newX, window.innerWidth - chatWidth));
    newY = Math.max(0, Math.min(newY, window.innerHeight - chatHeight));

    this.chatPosition = { x: newX, y: newY };
  }

  private stopDragging(mouseMoveHandler: (e: MouseEvent) => void, mouseUpHandler: () => void): void {
    this.isDragging = false;
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
  }

  // Start polling for unread message counts
  private startUnreadCountPolling(): void {
    // Poll every 5 seconds
    this.unreadCountPollingSubscription = interval(5000).pipe(
      startWith(0) // Start immediately
    ).subscribe(() => {
      this.loadUnreadCounts();
    });
  }

  // Load unread counts for all accepted applicants
  private loadUnreadCounts(): void {
    if (!this.userId || !this.requests) {
      return;
    }

    this.requests.forEach(request => {
      const acceptedApplicants = this.getAcceptedApplicants(request);
      acceptedApplicants.forEach(applicant => {
        const conversationKey = `${request.id}-${applicant.userId}`;

        this.chatService.getUnreadCount(request.id, this.userId, applicant.userId).subscribe({
          next: (response) => {
            this.unreadCounts.set(conversationKey, response.unreadCount);
          },
          error: (err) => {
            console.error('Error loading unread count:', err);
          }
        });
      });
    });
  }

  // Get unread message count for a specific conversation
  getUnreadCount(request: MyRequest, applicant: Applicant): number {
    const conversationKey = `${request.id}-${applicant.userId}`;
    return this.unreadCounts.get(conversationKey) || 0;
  }

  // Toggle chat minimize/maximize
  toggleChatMinimize(): void {
    this.chatMinimized = !this.chatMinimized;
  }

  // Get Google Maps URL for a location
  getGoogleMapsUrl(location: string): string {
    if (!location) return '#';
    const encodedLocation = encodeURIComponent(`${location}, Pakistan`);
    return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
  }


}