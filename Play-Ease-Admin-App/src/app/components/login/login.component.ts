import { Component, OnInit } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card'; // Import MatCardModule
import { CommonModule } from '@angular/common';
import { DxButtonModule, DxTextBoxModule } from 'devextreme-angular';
import { ActivatedRoute, Router } from '@angular/router';
const DEMO_PARAMS = {
	EMAIL: 'rana@gmail.com',
	PASSWORD: 'rana'
};

@Component({
  selector: 'app-login',
  imports: [
    // BrowserModule,
    CommonModule,
    // BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule, // Add this
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,  DxTextBoxModule,
    DxButtonModule
    // , DxChartModule, DxDataGridModule,
    // DxFormModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  // [x: string]: any;
  loginForm!: FormGroup 

  
    constructor(private formBuilder: FormBuilder,private router: Router) {
  }
  
  ngOnInit(): void {
		this.initLoginForm();

  }
  initLoginForm() {

		this.loginForm = this.formBuilder.group({
			email: [DEMO_PARAMS.EMAIL, Validators.compose([
				Validators.required,
				Validators.email,
				Validators.minLength(3),
				Validators.maxLength(320) 
			])
			],
			password: [DEMO_PARAMS.PASSWORD, Validators.compose([
				Validators.required,
				Validators.minLength(3),
				Validators.maxLength(100)
			])
			]
		});
	}
  
  onSubmit(): void {
    if (this.loginForm.valid) {
      const email = this.loginForm.get('email')?.value;
      const password = this.loginForm.get('password')?.value;

      if (email === DEMO_PARAMS.EMAIL && password === DEMO_PARAMS.PASSWORD) {
        console.log('Login successful');
        this.RedirectToList();
      } else {
        console.log('Invalid email or password');
      }
    }
  }

  RedirectToList(): void {
    this.router.navigate(['/dashboard']);
}
}
