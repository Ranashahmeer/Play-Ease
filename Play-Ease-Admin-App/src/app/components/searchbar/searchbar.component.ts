import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-searchbar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './searchbar.component.html',
  styleUrls: ['./searchbar.component.css']
})
export class SearchbarComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;
  @Output() search = new EventEmitter<string>();
  @Output() toggleFilters = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  ngOnInit() {
    // Set up real-time search with debounce (300ms delay)
    const searchControl = this.form.get('searchQuery');
    if (searchControl) {
      // Listen to value changes
      searchControl.valueChanges
        .pipe(
          debounceTime(300), // Wait 300ms after user stops typing
          distinctUntilChanged(), // Only emit if value actually changed
          takeUntil(this.destroy$)
        )
        .subscribe((searchText: string) => {
          this.search.emit(searchText || '');
        });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch() {
    const searchText = this.form.get('searchQuery')?.value || '';
    this.search.emit(searchText);
  }

  onFilterClick() {
    this.toggleFilters.emit();
  }
}
