import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GetDatabyDatasourceService } from '../../../services/get-data/get-databy-datasource.service';

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
export class MyRequestsComponent {
  @Input() requests: MyRequest[] = [];
  @Output() applicantStatusChanged = new EventEmitter<{ requestId: number; applicantId: number; status: 'accepted' | 'rejected' }>();

  showChat = false;
  currentChatApplicant = '';
  chatMessages: { type: string; text: string }[] = [];
  chatInput = '';

constructor( private getDataService: GetDatabyDatasourceService) {}

  ngOnInit(): void {
    this.getApplicantData();
  }
getApplicantData(): void {
  this.getDataService.getData(8, "").subscribe({
    next: (apiData: any[]) => {
      if (!apiData || !apiData.length) return;

      const rawJson = apiData[0]["JSON_F52E2B61-18A1-11d1-B105-00805F49916B"];

      if (!rawJson) {
        console.error("No JSON returned from SQL");
        return;
      }

      // 🚀 Parse real data (matches + applicants)
      const matches = JSON.parse(rawJson);

      // 🚀 Assign parsed data to your component
      this.requests = matches;
    },
    error: err => console.error("Error:", err)
  });
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

  startChat(applicantName: string, role: string): void {
    this.currentChatApplicant = `${applicantName} - ${role}`;
    this.chatMessages = [
      { type: 'system', text: `Chat started with ${this.currentChatApplicant}` }
    ];
    this.showChat = true;
  }

  closeChat(): void {
    this.showChat = false;
    this.chatMessages = [];
    this.chatInput = '';
  }

  sendMessage(): void {
    const text = this.chatInput.trim();
    if (!text) return;

    this.chatMessages.push({ type: 'you', text });
    this.chatInput = '';

    setTimeout(() => {
      this.chatMessages.push({ 
        type: 'them', 
        text: 'Thanks for your message! Looking forward to the match.' 
      });
    }, 1000);
  }

  handleChatKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
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