import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filter-drawer',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './filter-drawer.component.html',
  styleUrls: ['./filter-drawer.component.css']
})
export class FilterDrawerComponent {

  
  @Input() form!: FormGroup;
  @Input() timeOptions: { text: string }[] = [];
  @Input() minDate!: Date;

  @Output() applyFilters = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() useCurrentLocation = new EventEmitter<void>();
  @Output() selectTime = new EventEmitter<string>();

  onApplyFilters() {
    this.applyFilters.emit();
  }

  onClearFilters() {
    this.clearFilters.emit();
  }

  onUseLocation() {
    this.useCurrentLocation.emit();
  }

  onTimeSelect(value: any) {
    this.selectTime.emit(value);
  }

  // Safe getters to avoid null errors
  get selectedDate(): FormControl {
    return this.form.get('selectedDate') as FormControl;
  }

  get selectedTime(): FormControl {
    return this.form.get('selectedTime') as FormControl;
  }

  get matchDuration(): FormControl {
    return this.form.get('matchDuration') as FormControl;
  }

  get distance(): FormControl {
    return this.form.get('distance') as FormControl;
  }

  get selectedPitchSizes(): FormControl {
    return this.form.get('selectedPitchSizes') as FormControl;
  }

  get location(): FormControl {
    return this.form.get('location') as FormControl;
  }
}
