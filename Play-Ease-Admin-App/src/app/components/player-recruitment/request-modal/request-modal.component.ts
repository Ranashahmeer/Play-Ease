import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestPlayerService } from '../../../services/request-player.service';
import { HttpErrorResponse } from '@angular/common/http';
import { DxDateBoxModule } from 'devextreme-angular';


export interface MatchRequest {
  // id: number;
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
  createdAt:string;
}

@Component({
  selector: 'app-request-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DxDateBoxModule],
  templateUrl: './request-modal.component.html',
  styleUrls: ['./request-modal.component.css']
})
export class RequestModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() requestSubmitted = new EventEmitter<MatchRequest>();

  userId?: number;
  roleId?: number;
  matchName = '';
  location = '';
  matchDate: Date | null = null;
  startTime: Date | null = null;
  endTime: Date | null = null;
  roles = '';
  numPlayers = 1;
  price = 0;
  minDate: Date = new Date();
  showNotification = false;
  notificationText = '';
  fullname?: string;

 ngOnInit(): void {
    const saved = localStorage.getItem('loggedInUser');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        this.userId = p.userID;
        this.fullname=p.fullName
        this.roleId = p.roleID
      } catch {}
    }
  }


  constructor(private requestService: RequestPlayerService) {
    // minDate is set to today
  }

  closeModal(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  onSubmit(): void {
    if (!this.matchDate || !this.startTime || !this.endTime) {
      return;
    }

    if (this.endTime <= this.startTime) {
      return;
    }

    // Format date and time for backend
    const dateStr = this.formatDate(this.matchDate);
    const startTimeStr = this.formatTime(this.startTime);
    const endTimeStr = this.formatTime(this.endTime);

    // ✅ FIXED: Don't send ID, let backend generate it
     const request: MatchRequest = {
      title: this.matchName,
      date: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
      location: this.location,
      roles: this.roles,
      numPlayers: this.numPlayers,
      price: this.price,
      organizer: this.fullname!,
      organizerId: this.userId!,
      createdAt: new Date().toISOString()
    };

    this.requestService.createMatch(request).subscribe({
      next: (res) => {
        this.displayNotification('Match request posted successfully!');
        this.resetForm();
        // Emit the event to notify parent to refresh data
        this.requestSubmitted.emit(request);
        // Close modal after a short delay to show notification
        setTimeout(() => {
          this.close.emit();
        }, 500);
      },
      error: (err: HttpErrorResponse) => {
        this.displayNotification('Error posting match. Please try again.');
      }
    });
  }

  private resetForm(): void {
    this.matchName = '';
    this.location = '';
    this.matchDate = null;
    this.startTime = null;
    this.endTime = null;
    this.roles = '';
    this.numPlayers = 1;
    this.price = 0;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatTime(time: Date): string {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private displayNotification(message: string): void {
    this.notificationText = message;
    this.showNotification = true;
    setTimeout(() => {
      this.showNotification = false;
    }, 3000);
  }
}