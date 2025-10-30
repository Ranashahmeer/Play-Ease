import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

@Component({
  selector: 'app-available-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './available-requests.component.html',
  styleUrls: ['./available-requests.component.css']
})
export class AvailableRequestsComponent {
  @Input() requests: MatchRequest[] = [];
  @Output() applicationSubmitted = new EventEmitter<{ matchId: number; role: string }>();

  showRoleModal = false;
  selectedMatch: MatchRequest | null = null;
  availableRoles: string[] = [];
  appliedRequests = new Set<number>();
  showNotification = false;
  notificationText = '';

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
      this.appliedRequests.add(this.selectedMatch.id);
      this.applicationSubmitted.emit({
        matchId: this.selectedMatch.id,
        role: role
      });
      this.closeRoleModal();
      this.displayNotification(`Application submitted for ${role} position!`);
    }
  }

  isApplied(requestId: number): boolean {
    return this.appliedRequests.has(requestId);
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

  private displayNotification(message: string): void {
    this.notificationText = message;
    this.showNotification = true;
    setTimeout(() => {
      this.showNotification = false;
    }, 3000);
  }
}