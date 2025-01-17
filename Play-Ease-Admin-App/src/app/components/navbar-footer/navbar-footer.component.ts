import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar-footer',
  imports: [],
  templateUrl: './navbar-footer.component.html',
  styleUrl: './navbar-footer.component.css'
})
export class NavbarFooterComponent {

  constructor(private formBuilder: FormBuilder,private router: Router) {
  }
  navigateTo(route: string) {
  
    this.router.navigate([route]); // Navigate to the specified route
  }
}
