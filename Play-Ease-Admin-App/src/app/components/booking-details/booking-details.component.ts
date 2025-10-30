import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  DxDateBoxModule,
  DxButtonModule,
  DxGalleryModule,
  DxDropDownBoxModule,
  DxPopupModule,
  DxListModule
} from 'devextreme-angular';
import { Court } from '../../models/setupModels';

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [
    CommonModule,
    DxDateBoxModule,
    DxButtonModule,
    DxGalleryModule,
    DxDropDownBoxModule,
    DxPopupModule,
    DxListModule
  ],
  templateUrl: './booking-details.component.html',
  styleUrl: './booking-details.component.css'
})
export class CourtDetailsPopupComponent {
  @Input() popupVisible = false;
  @Input() selectedCourt: Court | null = null;
  @Input() form!: FormGroup;
  @Output() popupVisibleChange = new EventEmitter<boolean>();
  @Output() proceedToPayment = new EventEmitter<any>();
  @Output() durationChanged = new EventEmitter<number>();
  
  selectedBookingDate: Date = new Date();
  selectedBookingTime = '';
  selectedPitchSize = '';
  minDate: Date = new Date();
  
  bookedForDay: string[] = [];
  timeSlotItems: { text: string; disabled: boolean }[] = [];

  openCourtDetails(court: Court, sidebarDate: Date): void {
    this.selectedCourt = court;
    this.selectedBookingDate = sidebarDate instanceof Date ? sidebarDate : new Date();
    this.selectedBookingTime = '';
    this.selectedPitchSize = '';
    this.recomputeAvailability();
    this.popupVisible = true;
    this.popupVisibleChange.emit(true);
  }

  closePopup(): void {
    this.popupVisible = false;
    this.popupVisibleChange.emit(false);
  }

  setDuration(minutes: number): void {
    this.form.get('matchDuration')?.setValue(minutes);
    this.recomputeAvailability();
    this.durationChanged.emit(minutes);
  }

  recomputeAvailability(): void {
    if (!this.selectedCourt) {
      this.bookedForDay = [];
      this.timeSlotItems = [];
      return;
    }

    const key = this.toKey(this.selectedBookingDate);
    const booked = this.selectedCourt.bookedSlots?.[key] ?? [];
    this.bookedForDay = booked.slice().sort();

    const duration = Number(this.form.get('matchDuration')?.value) || 60;
    const bookedMinutes = booked.map(b => this.timeStringToMinutes(b));
    const openMin = this.timeStringToMinutes(this.selectedCourt.openingTime ?? '00:00 AM');
    const closeMin = this.timeStringToMinutes(this.selectedCourt.closingTime ?? '11:59 PM');

    const stepMinutes = duration;
    const generatedSlots = this.generateSlots(openMin, closeMin, stepMinutes, duration);

    this.timeSlotItems = generatedSlots
      .map(slot => {
        const slotMin = this.timeStringToMinutes(slot);
        const past = this.isPastSlot(slotMin, this.selectedBookingDate);

        let overlapsBooked = false;
        for (const bMin of bookedMinutes) {
          if (this.intervalsOverlap(slotMin, duration, bMin, duration)) {
            overlapsBooked = true;
            break;
          }
        }

        return { text: slot, disabled: overlapsBooked, _past: past };
      })
      .filter((i: any) => !i._past)
      .map((i: any) => ({ text: i.text, disabled: i.disabled }));

    if (this.selectedBookingTime) {
      const sel = this.timeSlotItems.find(i => i.text === this.selectedBookingTime);
      if (!sel || sel.disabled) {
        this.selectedBookingTime = '';
      }
    }
  }

  onBookingDateChanged(e: any): void {
    this.selectedBookingDate = e.value;
    this.recomputeAvailability();
  }

  onTimeItemClick(e: any, dropDownBoxRef: any): void {
    const item = e.itemData as { text: string; disabled: boolean };
    if (item.disabled) return;
    this.selectedBookingTime = item.text;
    try { dropDownBoxRef.instance.close(); } catch {}
  }

  selectPitch(size: any): void {
    if (this.selectedPitchSize === size.pitchtype) {
      this.selectedPitchSize = '';
    } else {
      this.selectedPitchSize = size.pitchtype;
    }
  }

  get selectedPitchPrice60(): number | null {
    if (!this.selectedCourt || !this.selectedPitchSize) return null;

    const pitch = this.selectedCourt.pitches.find(
      p => p.pitchtype === this.selectedPitchSize
    );

    return pitch ? pitch.price : null;
  }

  getComputedPrice(): number {
    if (!this.selectedCourt) return 0;

    const duration = Number(this.form.get('matchDuration')?.value) || 60;
    const basePrice = this.selectedPitchPrice60 ?? this.getCourtMinPrice(this.selectedCourt);

    return Math.round(basePrice * (duration / 60));
  }

  getCourtMinPrice(court: Court | null): number {
    if (!court || !court.pitches.length) return 0;

    const prices = court.pitches.map(p => p.price);
    return Math.min(...prices);
  }

  get allSlotsDisabled(): boolean {
    return this.timeSlotItems.length > 0 && this.timeSlotItems.every(i => i.disabled);
  }

  getOfferIcon(offer: string): string {
    const label = (offer || '').toLowerCase();
    if (label.includes('toilet') || label.includes('restroom')) return '🚻';
    if (label.includes('shower')) return '🚿';
    if (label.includes('water') || label.includes('drinking')) return '💧';
    if (label.includes('changing') || label.includes('change')) return '👕';
    if (label.includes('parking')) return '🅿️';
    if (label.includes('cafeteria') || label.includes('cafe') || label.includes('coffee')) return '☕';
    if (label.includes('equipment') || label.includes('rental')) return '🧰';
    return '✔️';
  }

  get galleryImages(): string[] {
    if (!this.selectedCourt) return [];
    if (this.selectedCourt.images && this.selectedCourt.images.length) 
      return this.selectedCourt.images;
    return this.selectedCourt.image ? [this.selectedCourt.image] : [];
  }

  openPaymentReview(): void {
    if (!this.selectedCourt) { alert('No court selected.'); return; }
    if (!this.selectedBookingDate) { alert('Please select a booking date.'); return; }
    if (!this.selectedBookingTime) { alert('Please select a time slot.'); return; }
    if (!this.selectedPitchSize) { alert('Please select a pitch size.'); return; }

    this.proceedToPayment.emit({
      court: this.selectedCourt,
      date: this.selectedBookingDate,
      time: this.selectedBookingTime,
      pitchSize: this.selectedPitchSize,
      price: this.getComputedPrice(),
      duration: this.form.get('matchDuration')?.value
    });
  }

  toKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
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
}