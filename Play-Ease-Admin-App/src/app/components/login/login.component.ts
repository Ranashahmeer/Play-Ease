import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, CommonModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  isOpen: boolean = true;
  isLogin: boolean = true; // To toggle between login and signup
  loginForm!: FormGroup;
  signupForm!: FormGroup;
  errorMessage = '';
  loginData: { email: object; password: object; } | undefined;
  

  constructor(private fb: FormBuilder,private authService: AuthService,private cdr: ChangeDetectorRef,private http: HttpClient,private router: Router) {}

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
    const { email, password } = this.loginForm.value;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find((user: any) => user.email === email && user.password === password);

    if (foundUser) {
      alert('Login successful!');
      // Store a "session" flag if needed:
      // localStorage.setItem('loggedInUser', JSON.stringify(foundUser));
      // this.router.navigate(['/dashboard']);
    } else {
      alert('Invalid email or password');
    }
  } else {
    alert('Please fill in valid email and password.');
  }
}
//handleLogin() {
    //if (this.loginForm.valid) {
      //const { email, password } =  this.loginForm.value;
  
      //this.authService.login(this.loginForm.value).subscribe({
        //next: (response: any) => {
          //console.log('Login successful:', response);
          //alert('Login successful!');
          // You can store the token in localStorage/sessionStorage if needed
          // localStorage.setItem('token', response.token);
        //},
        //error: (error: any) => {
          //console.error('Login failed:', error);
          //this.errorMessage = 'Invalid credentials';
        //}
      //});
   // } else {
     // console.log('Login form is invalid');
    //}
  //}

  handleSignup() {
  if (this.signupForm.valid) {
    const { email, password, confirmPassword } = this.signupForm.value;

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Retrieve existing users or empty array
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // Check if user already exists
    const exists = users.some((user: any) => user.email === email);
    if (exists) {
      alert('User already exists');
      return;
    }

    // Save new user
    users.push({ email, password });
    localStorage.setItem('users', JSON.stringify(users));
    alert('Signup successful! You can now login.');
    this.toggleLogin(); // Switch to login view
  } else {
    alert('Please fill all fields correctly.');
  }
}
//handleSignup() {
  //  if (this.signupForm.valid && this.signupForm.value.password === this.signupForm.value.confirmPassword) {
      // Handle signup logic here
    //  console.log('Sign up successful');
    //} else {
      //console.log('Signup form is invalid or passwords do not match');
    //}
  //}

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
