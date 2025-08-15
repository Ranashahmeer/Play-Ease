import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-navbar-footer',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './navbar-footer.component.html',
    styleUrls: ['./navbar-footer.component.css']
})
export class NavbarFooterComponent {

  constructor(private formBuilder: FormBuilder, private router: Router) {}

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
