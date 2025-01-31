import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  isOpen: boolean = true;
  isLogin: boolean = true; // To toggle between login and signup
  loginForm!: FormGroup;
  signupForm!: FormGroup;

  constructor(private fb: FormBuilder,private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // Initialize form groups for login and signup
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Getter methods for easy access in template
  get loginControls() { return this.loginForm.controls; }
  get signupControls() { return this.signupForm.controls; }

  handleLogin() {
    if (this.loginForm.valid) {
      // Handle login logic here
      console.log('Login successful');
    } else {
      console.log('Login form is invalid');
    }
  }

  handleSignup() {
    if (this.signupForm.valid && this.signupForm.value.password === this.signupForm.value.confirmPassword) {
      // Handle signup logic here
      console.log('Sign up successful');
    } else {
      console.log('Signup form is invalid or passwords do not match');
    }
  }

  closePopup() {
    this.isOpen = false; // Close the popup
    this.cdr.detectChanges(); 
  }

  toggleSignup() {
    this.isLogin = false; // Switch to sign up form
  }

  toggleLogin() {
    this.isLogin = true; // Switch to login form
  }
}
