import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  DxDateBoxModule,
  DxButtonModule,
  DxDropDownBoxModule,
  DxListModule,
  DxTagBoxModule,
  DxSliderModule
} from 'devextreme-angular';
import { Court } from '../../models/setupModels';

@Component({
  selector: 'app-searh-bar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DxDateBoxModule,
    DxButtonModule,
    DxDropDownBoxModule,
    DxListModule,
    DxTagBoxModule,
    DxSliderModule
  ],
  templateUrl: './searh-bar.component.html',
  styleUrl: './searh-bar.component.css'
})
export class SearchFilterComponent implements OnInit {
  @Input() courts: Court[] = [];
  @Output() filteredCourtsChange = new EventEmitter<Court[]>();
  @Output() durationChange = new EventEmitter<number>();
  @Output() formChange = new EventEmitter<FormGroup>();

  form!: FormGroup;
  minDate: Date = new Date();
  timeOptionsSidebar: { text: string; disabled: boolean }[] = [];
  noCourtsMessage = '';

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      selectedDate: [new Date()],
      selectedTime: [''],
      matchDuration: [60],
      selectedPitchSizes: [[]],
      distance: [25],
      searchQuery: [''],
    });
    
    this.formChange.emit(this.form);
    this.recomputeSidebarTimeOptions();
  }

  setDuration(minutes: number): void {
    this.form.get('matchDuration')?.setValue(minutes);
    this.recomputeSidebarTimeOptions();
    this.durationChange.emit(minutes);
  }

  useCurrentLocation(): void {
    alert('Using current location...');
  }

  applyFilters(): void {
    const { searchQuery, selectedPitchSizes } = this.form.value;
    const selTime = this.form.get('selectedTime')?.value as string;
    const selDate = this.form.get('selectedDate')?.value instanceof Date ? 
      this.form.get('selectedDate')!.value : new Date();
    const duration = Number(this.form.get('matchDuration')?.value) || 60;

    let filtered = this.courts.filter((court) => {
      const matchesSearch = court.name.toLowerCase().includes((searchQuery || '').toLowerCase());
      const matchesPitch = (selectedPitchSizes?.length ?? 0) === 0 ||
        court.pitches.some((pitch) => selectedPitchSizes.includes(pitch.pitchtype));
      return matchesSearch && matchesPitch;
    });

    if (selTime) {
      const startMin = this.timeStringToMinutes(selTime);
      filtered = filtered.filter(court => 
        this.isCourtAvailableAt(court, selDate, startMin, duration)
      );
      if (filtered.length === 0) {
        this.noCourtsMessage = 'No courts available for selected time and duration.';
        this.filteredCourtsChange.emit([]);
        return;
      }
    }

    this.noCourtsMessage = '';
    this.filteredCourtsChange.emit(filtered);
  }

  clearFilters(): void {
    this.form.reset({
      selectedDate: new Date(),
      selectedTime: '',
      matchDuration: 60,
      selectedPitchSizes: [],
      distance: 25,
      searchQuery: '',
    });

    this.noCourtsMessage = '';
    this.filteredCourtsChange.emit(this.courts);
    this.recomputeSidebarTimeOptions();
  }

  onSidebarTimeSelect(e: any, dropDownRef?: any): void {
    const item = e.itemData as { text: string; disabled: boolean };
    if (item.disabled) return;
    this.form.get('selectedTime')?.setValue(item.text);
    try { dropDownRef.instance.close(); } catch {}
  }

  recomputeSidebarTimeOptions(selectedCourt?: Court): void {
    const duration = Number(this.form.get('matchDuration')?.value) || 60;
    let sidebarOpenMin = selectedCourt?.openingMinutes;
    let sidebarCloseMin = selectedCourt?.closingMinutes;
    const stepMinutes = duration;
    
    if (sidebarOpenMin == null || sidebarCloseMin == null) {
      sidebarOpenMin = 0;
      sidebarCloseMin = 24 * 60;
    }
    
    const generated = this.generateSlots(sidebarOpenMin, sidebarCloseMin, stepMinutes, duration);
    const selDate = this.form.get('selectedDate')?.value instanceof Date ? 
      this.form.get('selectedDate')!.value : new Date();

    this.timeOptionsSidebar = generated
      .map(s => {
        const mins = this.timeStringToMinutes(s);
        const past = this.isPastSlot(mins, selDate);
        return { text: s, disabled: false, _past: past };
      })
      .filter((i: any) => !i._past)
      .map((i: any) => ({ text: i.text, disabled: false }));

    const cur = this.form.get('selectedTime')?.value;
    if (cur) {
      const found = this.timeOptionsSidebar.find(i => i.text === cur);
      if (!found) {
        this.form.get('selectedTime')?.setValue('');
      }
    }
  }

  private isCourtAvailableAt(court: Court, date: Date, startMin: number, duration: number): boolean {
    const openMin = this.timeStringToMinutes(court.openingTime ?? '00:00 AM');
    const closeMin = this.timeStringToMinutes(court.closingTime ?? '11:59 PM');

    if (startMin < openMin) return false;
    if (startMin + duration > closeMin) return false;

    const key = this.toKey(date);
    const booked = court.bookedSlots?.[key] ?? [];
    const bookedMinutes = booked.map(b => this.timeStringToMinutes(b));

    for (const bMin of bookedMinutes) {
      if (this.intervalsOverlap(startMin, duration, bMin, duration)) {
        return false;
      }
    }
    return true;
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

  private toKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}