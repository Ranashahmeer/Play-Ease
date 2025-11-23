import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BlockSlotDto {
  courtId: number;
  courtPitchId?: number | null;
  bookingDate: Date;
  startTime: string;
  endTime: string;
  ownerId: number;
  reason?: string;
}

export interface BlockedSlot {
  blockedSlotId: number;
  courtId: number;
  courtPitchId?: number | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
  createdAt: string;
  courtName?: string;
  pitchType?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlockedSlotsService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  blockSlot(dto: BlockSlotDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/BlockedSlots/block`, dto);
  }

  unblockSlot(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/BlockedSlots/unblock/${id}`);
  }

  getBlockedSlotsByOwner(ownerId: number): Observable<BlockedSlot[]> {
    return this.http.get<BlockedSlot[]>(`${this.apiUrl}/BlockedSlots/owner/${ownerId}`);
  }

  getBlockedSlotsByCourtAndDate(courtId: number, date: string): Observable<BlockedSlot[]> {
    return this.http.get<BlockedSlot[]>(`${this.apiUrl}/BlockedSlots/court/${courtId}/date/${date}`);
  }
}

