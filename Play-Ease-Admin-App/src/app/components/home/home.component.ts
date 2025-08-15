import { Component,CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
// import { DxDropDownBoxModule,DxListModule  } from 'devextreme-angular';
@Component({
    selector: 'app-home',
    imports: [MatSelectModule, MatFormFieldModule, MatInputModule, CommonModule],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeComponent {

  constructor(private formBuilder: FormBuilder,private router: Router,) {
  }

  navigateTo(route: string) {
  
    this.router.navigate([route]); // Navigate to the specified route
  }
  scrollLeft() {
    const container = document.querySelector('.scroll-container') as HTMLElement;
    const scrollAmount = 260;  // Adjust based on the card width + gap
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }

  scrollRight() {
    const container = document.querySelector('.scroll-container') as HTMLElement;
    const scrollAmount = 260;  // Adjust based on the card width + gap
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
}
