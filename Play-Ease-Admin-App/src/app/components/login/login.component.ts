import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  // UI state
  isOpen: boolean = true;
  isLogin: boolean = true; // toggle between login / signup

  // Reactive forms
  loginForm!: FormGroup;
  signupForm!: FormGroup;

  // misc
  errorMessage = '';
  loginData: { email: object; password: object; } | undefined;

  // Optional message passed from AuthGuard (e.g. "Please log in to continue")
  noticeText?: string;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private router: Router,
    @Inject(MatDialogRef) private dialogRef?: MatDialogRef<LoginComponent>,
    @Inject(MAT_DIALOG_DATA) private dialogData?: any
  ) {
    if (this.dialogData && this.dialogData.notice) {
      this.noticeText = this.dialogData.notice;
    }
  }

  ngOnInit() {
    // Login form (includes role radio)
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['player', [Validators.required]] // default to player
    });

    // Signup form: includes an accountType selector and all possible fields.
    // We'll toggle validators depending on selected accountType.
    this.signupForm = this.fb.group({
      accountType: ['player', [Validators.required]], // 'player' or 'owner'
      name: ['', []],
      age: [null, []],
      cnic: ['', []], // only required for owner
      phone: ['', []],
      email: ['', []],
      password: ['', []],
      confirmPassword: ['', []]
    });

    // Initialize validators for default accountType
    this.applySignupValidators(this.signupForm.get('accountType')!.value);

    // When accountType changes, update validators dynamically
    this.signupForm.get('accountType')!.valueChanges.subscribe((val) => {
      this.applySignupValidators(val);
    });
  }

  // Convenience getters
  get loginControls() { return this.loginForm.controls; }
  get signupControls() { return this.signupForm.controls; }

  /**
   * Apply required/validator rules based on account type
   */
  applySignupValidators(accountType: string) {
    // Clear existing validators first
    const name = this.signupForm.get('name')!;
    const age = this.signupForm.get('age')!;
    const cnic = this.signupForm.get('cnic')!;
    const phone = this.signupForm.get('phone')!;
    const email = this.signupForm.get('email')!;
    const password = this.signupForm.get('password')!;
    const confirmPassword = this.signupForm.get('confirmPassword')!;

    // reset
    name.clearValidators();
    age.clearValidators();
    cnic.clearValidators();
    phone.clearValidators();
    email.clearValidators();
    password.clearValidators();
    confirmPassword.clearValidators();

    // common validators for both roles
    name.setValidators([Validators.required, Validators.minLength(2)]);
    age.setValidators([Validators.required, Validators.min(10), Validators.max(120)]);
    phone.setValidators([Validators.required, Validators.minLength(7)]);
    email.setValidators([Validators.required, Validators.email]);
    password.setValidators([Validators.required, Validators.minLength(6)]);
    confirmPassword.setValidators([Validators.required, Validators.minLength(6)]);

    if (accountType === 'player') {
      // CNIC not required for player (clear value)
      cnic.setValue('');
      // keep validators as above (cnic none)
    } else if (accountType === 'owner') {
      // CNIC required for owner
      cnic.setValidators([Validators.required, Validators.minLength(5)]);
    }

    // update validity after changing validators
    name.updateValueAndValidity();
    age.updateValueAndValidity();
    cnic.updateValueAndValidity();
    phone.updateValueAndValidity();
    email.updateValueAndValidity();
    password.updateValueAndValidity();
    confirmPassword.updateValueAndValidity();
  }

  /**
   * Called when user submits login form.
   * For now we match against localStorage 'users' list.
   */
  handleLogin() {
    if (!this.loginForm.valid) {
      alert('Please fill in valid email, password and select a role.');
      return;
    }

    const { email, password, role } = this.loginForm.value;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find((user: any) =>
      user.email === email && user.password === password && user.role === role
    );

    if (foundUser) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('loggedInUser', JSON.stringify(foundUser));
      alert('Login successful! Logged in as: ' + role);
      try { this.dialogRef?.close(); } catch {}
      if (role === 'admin') {
        this.router.navigate(['/admin']);
      } else if (role === 'player') {
        this.router.navigate(['/player']);
      } else if (role === 'owner') {
        this.router.navigate(['/owner']);
      } else {
        this.router.navigate(['/']);
      }
    } else {
      alert('Invalid email, password, or role. Make sure you selected the correct role.');
    }
  }

  /**
   * Signup flow: validates role-specific fields and stores user in localStorage 'users' array.
   */
  handleSignup() {
    // mark controls as touched so errors appear visually if you add UI feedback later
    this.signupForm.markAllAsTouched();

    // basic form validity
    if (!this.signupForm.valid) {
      alert('Please fill all required fields correctly for the selected account type.');
      return;
    }

    const accountType = this.signupForm.get('accountType')!.value as 'player' | 'owner';
    const name = this.signupForm.get('name')!.value.trim();
    const age = this.signupForm.get('age')!.value;
    const cnic = this.signupForm.get('cnic')!.value ? this.signupForm.get('cnic')!.value.trim() : '';
    const phone = this.signupForm.get('phone')!.value.trim();
    const email = this.signupForm.get('email')!.value.trim().toLowerCase();
    const password = this.signupForm.get('password')!.value;
    const confirmPassword = this.signupForm.get('confirmPassword')!.value;

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Load existing users and check uniqueness by email (one account per email)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const exists = users.some((u: any) => u.email === email);
    if (exists) {
      alert('An account with this email already exists. Please use a different email or login.');
      return;
    }

    // Build user object according to role
    const newUser: any = {
      role: accountType === 'player' ? 'player' : 'owner',
      name,
      age,
      phone,
      email,
      password
    };

    if (accountType === 'owner') {
      newUser.cnic = cnic;
    }

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    alert(`Signup successful! You can now login as ${newUser.role}.`);
    // switch to login view for convenience
    this.toggleLogin();
    // reset signup form for next time
    this.signupForm.reset({ accountType: 'player' });
    // reapply validators for default
    this.applySignupValidators('player');
  }

  // Close popup if used in-page (non-dialog) — also works for dialog variant
  closePopup() {
    this.isOpen = false;
    try {
      this.dialogRef?.close();
    } catch {}
    this.cdr.detectChanges();
  }

  toggleSignup() {
    this.isLogin = false;
  }

  toggleLogin() {
    this.isLogin = true;
  }
}
