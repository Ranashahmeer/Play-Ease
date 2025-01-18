import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  constructor(private formBuilder: FormBuilder,private router: Router,) {
  }

  
  navigateTo(route: string) {
  
    this.router.navigate([route]); // Navigate to the specified route
  }
}
