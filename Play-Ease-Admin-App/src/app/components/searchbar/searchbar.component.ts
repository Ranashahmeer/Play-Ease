import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-searchbar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './searchbar.component.html',
  styleUrls: ['./searchbar.component.css']   // FIXED
})
export class SearchbarComponent {

  @Input() form!: FormGroup;
  @Output() search = new EventEmitter<string>();
  @Output() toggleFilters = new EventEmitter<void>();

  onSearch() {
    this.search.emit();
  }

  onFilterClick() {
    this.toggleFilters.emit();
  }
}
