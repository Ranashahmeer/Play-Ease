import { Component, EventEmitter, Output } from '@angular/core';
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
  selector: 'app-request-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './request-modal.component.html',
  styleUrls: ['./request-modal.component.css']
})
export class RequestModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() requestSubmitted = new EventEmitter<MatchRequest>();

  matchName = '';
  location = '';
  matchDate = '';
  startTime = '';
  endTime = '';
  roles = '';
  numPlayers = 1;
  price = 0;
  minDate = '';
  showNotification = false;
  notificationText = '';

  constructor() {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
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
    if (this.endTime <= this.startTime) {
      alert('⚠️ End time must be after start time!');
      return;
    }

    // ✅ FIXED: Don't send ID, let backend generate it
    const request: MatchRequest = {
      id: 0, // Backend will auto-generate
      title: this.matchName,
      date: this.matchDate, // Keep as string, backend will parse
      startTime: this.startTime,
      endTime: this.endTime,
      location: this.location,
      roles: this.roles,
      numPlayers: this.numPlayers,
      price: this.price,
      organizer: '', // Will be set by parent component
      organizerId: 0, // Will be set by parent component
      isOwn: true
    };

    console.log('📤 Submitting request from modal:', request);
    this.requestSubmitted.emit(request);
    this.resetForm();
    this.displayNotification('Match request posted successfully!');
  }

  private resetForm(): void {
    this.matchName = '';
    this.location = '';
    this.matchDate = '';
    this.startTime = '';
    this.endTime = '';
    this.roles = '';
    this.numPlayers = 1;
    this.price = 0;
  }

  private displayNotification(message: string): void {
    this.notificationText = message;
    this.showNotification = true;
    setTimeout(() => {
      this.showNotification = false;
    }, 3000);
  }
}