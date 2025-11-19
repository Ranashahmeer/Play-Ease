import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DxDateBoxModule, DxButtonModule, DxGalleryModule, DxFileUploaderModule, DxListModule, DxTagBoxModule, DxSliderModule, DxDropDownBoxModule, DxPopupModule, DxCalendarComponent } from 'devextreme-angular';
import{CourtListComponent} from '../court-list/court-list.component';
import { PaymentPopupComponent } from "../payment-popup/payment-popup.component";
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';
import { CourtAdapter } from '../../adapters/court.adapter';
 

@Component({
  selector: 'app-court-booking',
  standalone: true,
   imports: [
    CommonModule, ReactiveFormsModule, DxDateBoxModule, DxButtonModule, DxListModule, DxTagBoxModule, DxSliderModule, DxGalleryModule, DxGalleryModule, DxFileUploaderModule, DxPopupModule, DxDropDownBoxModule,
    CourtListComponent,
    PaymentPopupComponent,
    DxCalendarComponent
],
  templateUrl: './court-booking.component.html',
  styleUrl: './court-booking.component.css'
})
export class CourtBookingComponent implements OnInit {
  form: FormGroup;
  courtId!: number;
  courtDetails: any;
  selectedPitchSize: string = '';
  selectedBookingDate: Date = new Date();
  selectedBookingTime: string = '';
  timeSlotItems: any[] = [];
  bookedForDay: string[] = [];
  allSlotsDisabled = false;
  paymentPopupVisible: boolean = false;
  ddBox: any;
  selectedCourt: any[] = [];  

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,private dataService: GetDatabyDatasourceService,
    private router: Router
  ) {
    this.form = this.fb.group({
      matchDuration: [60],
      selectedPitchSizes: [[]],
      searchQuery: ['']
    });
  }

  ngOnInit() {
    this.courtId = +this.route.snapshot.paramMap.get('courtId')!;
    this.fetchCourtDetails();
  }

fetchCourtDetails() {
  const whereclause = `c.CourtID = ${this.courtId}`;
  this.dataService.getData(1, whereclause).subscribe({
    next: (data: any[]) => {
      const adapter = new CourtAdapter();
      const apiData = Array.isArray(data) ? data : [];
      this.courtDetails = apiData.length > 0 ? adapter.fromApi(apiData[0]) : null;
    },
    error: (err) => {
      // Error loading courts
    }
  });
}


  selectPitch(pitch: any) {
    this.selectedPitchSize = pitch.pitchtype;
  }

  onBookingDateChanged(e: any) {
    this.selectedBookingDate = e.value;
    this.recomputeAvailability();
  }

  onTimeItemClick(e: any, ddBox: any) {
    const item = e.itemData;
    if (item.disabled) return;
    this.selectedBookingTime = item.text;
    try { ddBox.instance.close(); } catch {}
  }

  recomputeAvailability() {
    if (!this.courtDetails) return;

    const key = this.toKey(this.selectedBookingDate);
    const booked = this.courtDetails.bookedSlots?.[key] ?? [];
    this.bookedForDay = booked.slice().sort();

    const duration = Number(this.form.get('matchDuration')?.value) || 60;
    const openMin = this.timeStringToMinutes(this.courtDetails.openingTime);
    const closeMin = this.timeStringToMinutes(this.courtDetails.closingTime);

    const generatedSlots = this.generateSlots(openMin, closeMin, duration, duration);
    const bookedMinutes = booked.map((b: any) => this.timeStringToMinutes(b));

    this.timeSlotItems = generatedSlots.map(slot => {
      const slotMin = this.timeStringToMinutes(slot);
      const overlaps = bookedMinutes.some((bMin: any) => this.intervalsOverlap(slotMin, duration, bMin, duration));
      return { text: slot, disabled: overlaps };
    });

    // Reset selected time if invalid
    if (this.selectedBookingTime) {
      const sel = this.timeSlotItems.find(i => i.text === this.selectedBookingTime);
      if (!sel || sel.disabled) this.selectedBookingTime = '';
    }

    this.allSlotsDisabled = this.timeSlotItems.every(i => i.disabled);
  }

  getComputedPrice() {
    if (!this.courtDetails) return 0;
    const duration = Number(this.form.get('matchDuration')?.value) || 60;
    const basePrice = this.selectedPitchSize
      ? this.courtDetails.pitches.find((p: any) => p.pitchtype === this.selectedPitchSize)?.price
      : Math.min(...this.courtDetails.pitches.map((p: any) => p.price));
    return Math.round(basePrice * (duration / 60));
  }

  proceedToPayment() {
    if (!this.selectedPitchSize || !this.selectedBookingTime) {
      return;
    }
    this.paymentPopupVisible = true;
  }

  toKey(d: Date): string {
    return d.toISOString().split('T')[0]; // simple date key YYYY-MM-DD
  }
private timeStringToMinutes(t: string): number {
    if (!t) return 0;
    const [timePart, ampm] = t.split(' ');
    const [hhStr, mmStr] = timePart.split(':');
    let hh = parseInt(hhStr, 10);
    const mm = parseInt(mmStr, 10);
    if ((ampm || '').toUpperCase() === 'PM' && hh !== 12) hh += 12;
    if ((ampm || '').toUpperCase() === 'AM' && hh === 12) hh = 0;
    return hh * 60 + mm;
  }

  private generateSlots(startMin: number, endMin: number, stepMinutes: number, duration: number): string[] {
    const slots: string[] = [];
    if (stepMinutes <= 0 || duration <= 0) return slots;
    let cur = startMin;
    while (cur + duration <= endMin) {
      slots.push(this.minutesToTimeString(cur));
      cur += stepMinutes;
    }
    return slots;
  }
  private minutesToTimeString(mins: number): string {
    mins = ((mins % (24 * 60)) + (24 * 60)) % (24 * 60);
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const displayHour = ((hh + 11) % 12) + 1;
    return `${String(displayHour).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`;
  }
  private intervalsOverlap(startA: number, durationA: number, startB: number, durationB: number): boolean {
    const endA = startA + durationA;
    const endB = startB + durationB;
    return startA < endB && startB < endA;
  }

  private isPastSlot(slotMinutes: number, date: Date): boolean {
    const now = new Date();
    const slotDateKey = this.toKey(date);
    const todayKey = this.toKey(now);
    if (slotDateKey !== todayKey) return false;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return slotMinutes <= nowMinutes;
  }
}
