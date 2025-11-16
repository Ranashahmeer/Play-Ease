import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestPlayerService } from '../../../services/request-player.service';
import { HttpErrorResponse } from '@angular/common/http';


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
  imports: [CommonModule, FormsModule],
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
  matchDate = '';
  startTime = '';
  endTime = '';
  roles = '';
  numPlayers = 1;
  price = 0;
  minDate = '';
  showNotification = false;
  notificationText = '';
  fullname?: string;

 ngOnInit(): void {
    const saved = localStorage.getItem('loggedInUser');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        this.userId = p.userId;
        this.fullname=p.fullName
        this.roleId = p.roleId
      } catch {}
    }
  }


  constructor(private requestService: RequestPlayerService) {
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
      title: this.matchName,
      date: this.matchDate,
      startTime: this.startTime,
      endTime: this.endTime,
      location: this.location,
      roles: this.roles,
      numPlayers: this.numPlayers,
      price: this.price,
      organizer: this.fullname!,
      organizerId: this.userId!,
      createdAt: new Date().toISOString()
    };

    console.log('📤 Submitting request from modal:', request);
        this.requestService.createMatch(request).subscribe({
      next: (res) => {
        console.log('✅ Match created successfully:', res);
        this.displayNotification('Match request posted successfully!');
        this.resetForm();
        this.close.emit(); // optional: close modal
      },
      error: (err: HttpErrorResponse) => {
        console.error('❌ Error creating match:', err);
        this.displayNotification('Error posting match. Please try again.');
      }
    });

    this.requestSubmitted.emit(request);
    // this.resetForm();
    // this.displayNotification('Match request posted successfully!');
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