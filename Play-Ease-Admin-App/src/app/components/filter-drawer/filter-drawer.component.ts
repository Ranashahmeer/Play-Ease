import { Component, Input, Output, EventEmitter, HostListener, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-filter-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './filter-drawer.component.html',
  styleUrls: ['./filter-drawer.component.css']
})
export class FilterDrawerComponent implements OnChanges, OnInit, OnDestroy {

  
  @Input() form!: FormGroup;
  @Input() timeOptions: { text: string }[] = [];
  @Input() minDate!: Date;
  @Input() isOpen: boolean = false;

  @Output() applyFilters = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() selectTime = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<void>(); // New event for real-time filter changes

  private destroy$ = new Subject<void>();

  onApplyFilters() {
    this.applyFilters.emit();
  }

  onClearFilters() {
    this.clearFilters.emit();
  }

  onTimeSelect(value: any) {
    this.selectTime.emit(value);
  }

  onClose() {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent) {
    // Close drawer when clicking on backdrop
    if ((event.target as HTMLElement).classList.contains('drawer-backdrop')) {
      this.onClose();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.isOpen) {
      this.onClose();
    }
  }

  ngOnInit() {
    // Set up real-time filter change detection
    if (this.form) {
      // Watch for changes in filter fields (excluding searchQuery)
      const filterControls = ['selectedDate', 'selectedTime', 'matchDuration', 'selectedPitchSizes', 'location'];
      
      filterControls.forEach(controlName => {
        const control = this.form.get(controlName);
        if (control) {
          control.valueChanges
            .pipe(
              debounceTime(300),
              distinctUntilChanged(),
              takeUntil(this.destroy$)
            )
            .subscribe(() => {
              // Emit filter change event for real-time application
              if (this.isOpen) {
                this.filterChange.emit();
              }
            });
        }
      });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen']) {
      // Prevent body scroll when drawer is open
      if (this.isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
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
