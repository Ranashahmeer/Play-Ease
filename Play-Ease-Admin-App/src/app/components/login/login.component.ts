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
  imports: [ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoginPopupVisible = false;
  isSignUp = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  openLoginPopup(): void {
    this.isLoginPopupVisible = true;
  }

  closePopup(): void {
    this.isLoginPopupVisible = false;
  }

  toggleForm(): void {
    this.isSignUp = !this.isSignUp;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const formData = this.loginForm.value;
      if (this.isSignUp) {
        // Handle sign-up logic
        console.log('Sign Up Data: ', formData);
      } else {
        // Handle sign-in logic
        console.log('Sign In Data: ', formData);
      }
      this.closePopup();
    }
  }
}
