import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GetDatabyDatasourceService } from '../../../services/get-data/get-databy-datasource.service';

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
  constructor( private getDataService: GetDatabyDatasourceService) {}

  ngOnInit(): void {
    this.matchesData()
    const saved = localStorage.getItem('loggedInUser');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        this.fullname=p.fullName
      } catch {}
    }
  }


  matchesData(): void {
  this.getDataService.getData(7, '').subscribe({
    next: (apiData: any[] | null | undefined) => {
      const data = Array.isArray(apiData) ? apiData : [];
      if (!data.length) return;
      // Map API data to MatchRequest interface
      this.requests = data.map(item => ({
      id: item.Id ?? 0,
      title: item.Title ?? 'Untitled Match',
      date: item.Date ?? '',
      startTime: item.StartTime ?? '',
      endTime: item.EndTime ?? '',
      location: item.Location ?? '',
      roles: item.Roles ?? '',
      numPlayers: item.NumPlayers ?? 0,
      price: item.Price ?? 0,
      organizer: item.Organizer ?? 'Unknown',
      organizerId: item.OrganizerId ?? 0,
      isOwn: item.OrganizerId === this.userId,
      createdAt: item.CreatedAt ?? ''
}));
    },
    error: err => {
      console.error('Error fetching match data:', err);
    }
  });
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
      this.appliedRequests.add(this.selectedMatch.id);
      this.applicationSubmitted.emit({
      matchId: this.selectedMatch.id,
      userId: this.userId,
      userName: this.fullname,  // We'll define it below
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