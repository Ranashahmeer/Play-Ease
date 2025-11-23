import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DxCalendarModule, DxButtonModule } from 'devextreme-angular';
import { BlockedSlotsService, BlockSlotDto, BlockedSlot } from '../../services/blocked-slots.service';
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-manage-slots',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DxCalendarModule, DxButtonModule],
  templateUrl: './manage-slots.component.html',
  styleUrl: './manage-slots.component.css'
})
export class ManageSlotsComponent implements OnInit {
  form: FormGroup;
  ownerId: number = 0;
  ownerCourts: any[] = [];
  selectedCourtId: number = 0;
  selectedDate: Date = new Date();
  selectedStartTime: string = '';
  selectedEndTime: string = '';
  minDate: Date = new Date();
  blockedSlots: BlockedSlot[] = [];
  timeSlotItems: any[] = [];
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private blockedSlotsService: BlockedSlotsService,
    private dataService: GetDatabyDatasourceService,
    private alertService: AlertService
  ) {
    this.form = this.fb.group({
      courtId: [0],
      courtPitchId: [null],
      reason: ['']
    });
  }

  ngOnInit(): void {
    const saved = localStorage.getItem('loggedInUser');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        const userId = p.userID;
        this.loadOwnerData(userId);
      } catch {}
    }
  }

  loadOwnerData(userId: number): void {
    const whereclause = `co.userid = ${userId}`;
    this.dataService.getData(5, whereclause).subscribe({
      next: (apiData: any[] | null | undefined) => {
        const ownerData = Array.isArray(apiData) ? apiData : [];
        if (!ownerData.length) {
          this.alertService.warning('No owner data found');
          return;
        }

        const first = ownerData[0];
        this.ownerId = first.ownerid || first.OwnerID;
        
        this.ownerCourts = ownerData.map(c => ({
          courtId: c.courtid || c.CourtID,
          name: c.CourtName || c.courtname,
          location: c.location || c.Location,
          pitches: c.pitches || []
        }));

        if (this.ownerCourts.length > 0) {
          this.selectedCourtId = this.ownerCourts[0].courtId;
          this.form.patchValue({ courtId: this.selectedCourtId });
          this.loadBlockedSlots();
        }
      },
      error: (err: any) => {
        console.error('Error loading owner data:', err);
        this.alertService.error('Failed to load owner data');
      }
    });
  }

  onCourtChange(): void {
    this.selectedCourtId = this.form.get('courtId')?.value || 0;
    this.loadBlockedSlots();
    this.generateTimeSlots();
  }

  onDateChange(e: any): void {
    this.selectedDate = e.value || new Date();
    this.generateTimeSlots();
    this.loadBlockedSlots();
  }

  generateTimeSlots(): void {
    if (!this.selectedCourtId) return;

    const whereclause = `c.CourtID = ${this.selectedCourtId}`;
    this.dataService.getData(1, whereclause).subscribe({
      next: (data: any[]) => {
        const apiData = Array.isArray(data) ? data : [];
        if (apiData.length === 0) return;

        const court = apiData[0];
        const openingTime = court.openingtime || court.OpeningTime || '09:00:00';
        const closingTime = court.closingtime || court.ClosingTime || '22:00:00';

        const openMin = this.timeStringToMinutes(openingTime);
        const closeMin = this.timeStringToMinutes(closingTime);
        
        this.timeSlotItems = [];
        for (let min = openMin; min < closeMin; min += 30) {
          this.timeSlotItems.push({
            text: this.minutesToTimeString(min),
            minutes: min
          });
        }
      },
      error: (err: any) => {
        console.error('Error loading court details:', err);
      }
    });
  }

  onStartTimeSelect(time: string): void {
    this.selectedStartTime = time;
    this.selectedEndTime = '';
  }

  onEndTimeSelect(time: string): void {
    if (!this.selectedStartTime) {
      this.alertService.warning('Please select start time first');
      return;
    }

    const startMin = this.timeStringToMinutes(this.selectedStartTime);
    const endMin = this.timeStringToMinutes(time);

    if (endMin <= startMin) {
      this.alertService.warning('End time must be after start time');
      return;
    }

    this.selectedEndTime = time;
  }

  blockSlot(): void {
    if (!this.selectedCourtId || !this.selectedDate || !this.selectedStartTime || !this.selectedEndTime) {
      this.alertService.error('Please fill all required fields');
      return;
    }

    if (this.selectedDate < new Date(new Date().setHours(0, 0, 0, 0))) {
      this.alertService.error('Cannot block slots in the past');
      return;
    }

    this.isLoading = true;
    const dto: BlockSlotDto = {
      courtId: this.selectedCourtId,
      courtPitchId: this.form.get('courtPitchId')?.value || null,
      bookingDate: this.selectedDate,
      startTime: this.convertToTimeSpan(this.selectedStartTime),
      endTime: this.convertToTimeSpan(this.selectedEndTime),
      ownerId: this.ownerId,
      reason: this.form.get('reason')?.value || 'External booking'
    };

    this.blockedSlotsService.blockSlot(dto).subscribe({
      next: (response: any) => {
        this.alertService.success('Slot blocked successfully');
        this.resetForm();
        this.loadBlockedSlots();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error blocking slot:', err);
        this.alertService.error(err?.error?.error || 'Failed to block slot');
        this.isLoading = false;
      }
    });
  }

  unblockSlot(id: number): void {
    if (!confirm('Are you sure you want to unblock this slot?')) return;

    this.blockedSlotsService.unblockSlot(id).subscribe({
      next: () => {
        this.alertService.success('Slot unblocked successfully');
        this.loadBlockedSlots();
      },
      error: (err: any) => {
        console.error('Error unblocking slot:', err);
        this.alertService.error('Failed to unblock slot');
      }
    });
  }

  loadBlockedSlots(): void {
    if (!this.ownerId) return;

    this.blockedSlotsService.getBlockedSlotsByOwner(this.ownerId).subscribe({
      next: (slots: BlockedSlot[]) => {
        this.blockedSlots = slots.filter(s => {
          const slotDate = new Date(s.bookingDate);
          const selectedDate = new Date(this.selectedDate);
          return slotDate.getTime() === selectedDate.getTime() && 
                 s.courtId === this.selectedCourtId;
        });
      },
      error: (err: any) => {
        console.error('Error loading blocked slots:', err);
      }
    });
  }

  resetForm(): void {
    this.selectedStartTime = '';
    this.selectedEndTime = '';
    this.form.patchValue({ reason: '' });
  }

//   public timeStringToMinutes(t: string): number {
//     if (!t) return 0;
//     const [timePart, ampm] = t.split(' ');
//     const [hh, mm] = timePart.split(':').map(Number);
//     let hours = hh;
//     if (ampm?.toUpperCase() === 'PM' && hh !== 12) hours += 12;
//     if (ampm?.toUpperCase() === 'AM' && hh === 12) hours = 0;
//     return hours * 60 + mm;
//   }

   minutesToTimeString(mins: number): string {
    mins = ((mins % 1440) + 1440) % 1440;
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const displayHour = ((hh + 11) % 12) + 1;
    return `${String(displayHour).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`;
  }

   convertToTimeSpan(time12hr: string): string {
    const [timePart, ampm] = time12hr.split(' ');
    const [hours, minutes] = timePart.split(':').map(Number);
    let hours24 = hours;
    if (ampm?.toUpperCase() === 'PM' && hours !== 12) hours24 += 12;
    if (ampm?.toUpperCase() === 'AM' && hours === 12) hours24 = 0;
    return `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  }

  timeStringToMinutes(t: string): number {
    if (!t) return 0;
    const [timePart, ampm] = t.split(' ');
    const [hh, mm] = timePart.split(':').map(Number);
    let hours = hh;
    if (ampm?.toUpperCase() === 'PM' && hh !== 12) hours += 12;
    if (ampm?.toUpperCase() === 'AM' && hh === 12) hours = 0;
    return hours * 60 + mm;
  }

  convertTimeSpanTo12Hour(timeSpan: string): string {
    if (!timeSpan) return '';
    const parts = timeSpan.split(':');
    if (parts.length < 2) return '';
    const [hours, minutes] = parts.map(Number);
    if (isNaN(hours) || isNaN(minutes)) return '';
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
    return `${String(displayHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
  }
}

