import { Component, OnInit, Inject, ChangeDetectorRef, AfterViewInit, ViewChild, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormGroup, Validators, FormBuilder, ValidatorFn, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription, fromEvent, debounceTime, distinctUntilChanged } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('contentBody') contentBody!: ElementRef<HTMLElement>;

  // UI state
  isOpen = true;
  isLogin = true;
  showForgotPassword = false;
  forgotPasswordStep: 'email' | 'code' | 'reset' = 'email';
  signupAttempted = false;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  showNewPassword = false;

  // Forms
  loginForm!: FormGroup;
  signupForm!: FormGroup;
  forgotPasswordForm!: FormGroup;

  // Error/Success messages
  loginError = '';
  signupError = '';
  forgotPasswordError = '';
  successMessage = '';

  // Email availability
  emailAvailable: boolean | null = null;
  checkingEmail = false;

  // Password strength
  passwordStrength: 'weak' | 'medium' | 'strong' = 'weak';
  passwordStrengthText = '';

  // Scroll fade state
  private scrollSub?: Subscription;
  private emailCheckSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    @Inject(MatDialogRef) private dialogRef?: MatDialogRef<LoginComponent>,
    @Inject(MAT_DIALOG_DATA) private dialogData?: any
  ) { }

  ngOnInit(): void {
    // Login form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['player', [Validators.required]]
    });

    // Signup form with enhanced validations
    this.signupForm = this.fb.group({
      accountType: ['player', [Validators.required]],
      name: ['', []],
      age: [null, []],
      phone: ['', []],
      cnic: ['', []],
      email: ['', []],
      password: ['', []],
      confirmPassword: ['', []]
    }, { validators: [this.matchPasswordsValidator('password', 'confirmPassword')] });

    this.applySignupValidators(this.signupForm.get('accountType')!.value);
    this.signupForm.get('accountType')!.valueChanges.subscribe(val => this.applySignupValidators(val));

    // Forgot password form
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', []],
      newPassword: ['', []],
      confirmNewPassword: ['', []]
    });

    // Email availability check on signup
    this.emailCheckSub = this.signupForm.get('email')!.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(email => {
      if (email && this.signupForm.get('email')!.valid) {
        this.checkEmailAvailability(email);
      } else {
        this.emailAvailable = null;
      }
    });

    // Password strength check
    this.signupForm.get('password')!.valueChanges.subscribe(password => {
      this.calculatePasswordStrength(password);
    });
  }

  ngAfterViewInit(): void {
    if (this.contentBody) {
      this.updateFadeState();
      this.scrollSub = fromEvent(this.contentBody.nativeElement, 'scroll').pipe(throttleTime(100))
        .subscribe(() => this.updateFadeState());
    }
  }

  ngOnDestroy(): void {
    this.scrollSub?.unsubscribe();
    this.emailCheckSub?.unsubscribe();
  }

  // Convenience getters
  get loginControls(): any { return this.loginForm.controls; }
  get signupControls(): any { return this.signupForm.controls; }
  get forgotControls(): any { return this.forgotPasswordForm.controls; }

  get isLoginValid(): boolean { return this.loginForm.valid; }
  get isSignupValid(): boolean {
    const gmErr = (this.signupForm.errors as any) || {};
    return this.signupForm.valid && !gmErr.passwordMismatch && this.emailAvailable === true;
  }

  // Email availability check
  checkEmailAvailability(email: string): void {
    this.checkingEmail = true;
    this.http.get<{ available: boolean }>(`http://localhost:5000/api/login/check-email?email=${encodeURIComponent(email)}`)
      .subscribe({
        next: (res) => {
          this.emailAvailable = res.available;
          this.checkingEmail = false;
        },
        error: () => {
          this.emailAvailable = null;
          this.checkingEmail = false;
        }
      });
  }

  // Password strength calculator
  calculatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = 'weak';
      this.passwordStrengthText = '';
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) {
      this.passwordStrength = 'weak';
      this.passwordStrengthText = 'Weak';
    } else if (strength <= 4) {
      this.passwordStrength = 'medium';
      this.passwordStrengthText = 'Medium';
    } else {
      this.passwordStrength = 'strong';
      this.passwordStrengthText = 'Strong';
    }
  }

  // Enhanced validators
  applySignupValidators(accountType: string) {
    const name = this.signupForm.get('name')!;
    const age = this.signupForm.get('age')!;
    const phone = this.signupForm.get('phone')!;
    const cnic = this.signupForm.get('cnic')!;
    const email = this.signupForm.get('email')!;
    const password = this.signupForm.get('password')!;
    const confirmPassword = this.signupForm.get('confirmPassword')!;

    [name, age, phone, cnic, email, password, confirmPassword].forEach(c => c.clearValidators());

    name.setValidators([
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
      Validators.pattern(/^[A-Za-z\s]+$/)
    ]);

    const minAge = accountType === 'owner' ? 18 : 10;
    age.setValidators([
      Validators.required,
      Validators.min(minAge),
      Validators.max(120)
    ]);

    phone.setValidators([
      Validators.required,
      Validators.pattern(/^(?:\+92|92|0)?3\d{9}$/)
    ]);

    email.setValidators([
      Validators.required,
      Validators.email
    ]);

    password.setValidators([
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(50),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
    ]);

    confirmPassword.setValidators([Validators.required]);

    if (accountType === 'owner') {
      cnic.setValidators([
        Validators.required,
        Validators.pattern(/^\d{5}-\d{7}-\d$/)
      ]);
    } else {
      cnic.setValue('');
      cnic.clearValidators();
    }

    [name, age, phone, cnic, email, password, confirmPassword].forEach(c => c.updateValueAndValidity());
  }

  private matchPasswordsValidator(passwordKey: string, confirmKey: string): ValidatorFn {
    return (group: AbstractControl) => {
      const p = group.get(passwordKey);
      const c = group.get(confirmKey);
      if (!p || !c) return null;
      return p.value === c.value ? null : { passwordMismatch: true };
    };
  }

  // Password visibility toggles
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  // LOGIN handler
  handleLogin(): void {
    this.loginForm.markAllAsTouched();
    if (!this.loginForm.valid) return;

    this.isLoading = true;
    this.loginError = '';
    const { email, password, role } = this.loginForm.value;

    this.authService.login({ email, password, role }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const user = {
          userID: res.userId,
          fullName: res.fullName,
          email: res.email,
          roleID: res.roleId
        };

        if (!user.roleID) return;

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("loggedInUser", JSON.stringify(user));

        if (user.roleID === 1) {
          this.router.navigate(['/my-account']).then(() => this.dialogRef?.close());
        } else if (user.roleID === 2 || user.roleID === 3) {
          this.router.navigate(['/bookings']).then(() => this.dialogRef?.close());
        } else {
          this.router.navigate(['/home']).then(() => this.dialogRef?.close());
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.loginError = err.error?.message || 'Invalid email or password';
        setTimeout(() => this.loginError = '', 5000);
      }
    });
  }

  // SIGNUP handler
  handleSignup(): void {
    this.signupAttempted = true;
    this.signupForm.markAllAsTouched();
    this.signupError = '';

    if (!this.isSignupValid) return;

    const accountType = this.signupForm.get('accountType')!.value as 'player' | 'owner';
    const age = Number(this.signupForm.get('age')!.value);

    if (accountType === 'player' && age < 10) return;
    if (accountType === 'owner' && age < 18) return;

    this.isLoading = true;

    const userPayload = {
      fullName: String(this.signupForm.get('name')!.value || '').trim(),
      phone: String(this.signupForm.get('phone')!.value || '').trim(),
      email: String(this.signupForm.get('email')!.value || '').trim().toLowerCase(),
      password: this.signupForm.get('password')!.value,
      age: this.signupForm.get('age')!.value,
      cnic: this.signupForm.get('cnic')?.value || '',
      roleID: accountType === 'player' ? 2 : 3
    };

    this.authService.register(userPayload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.successMessage = 'Account created successfully! Please sign in.';
        setTimeout(() => {
          this.toggleLogin();
          this.signupForm.reset({ accountType: 'player' });
          this.applySignupValidators('player');
          this.signupAttempted = false;
          this.successMessage = '';
          this.emailAvailable = null;
        }, 2000);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.signupError = err.error?.message || 'Registration failed. Please try again.';
        setTimeout(() => this.signupError = '', 5000);
      }
    });
  }

  // FORGOT PASSWORD handlers
  openForgotPassword(event?: Event): void {
    if (event) event.preventDefault();
    this.showForgotPassword = true;
    this.forgotPasswordStep = 'email';
    this.forgotPasswordError = '';
    this.forgotPasswordForm.reset();
  }

  closeForgotPassword(): void {
    this.showForgotPassword = false;
    this.forgotPasswordForm.reset();
    this.forgotPasswordError = '';
  }

  handleForgotPasswordSubmit(): void {
    if (this.forgotPasswordStep === 'email') {
      this.sendVerificationCode();
    } else if (this.forgotPasswordStep === 'code') {
      this.verifyCode();
    } else {
      this.resetPassword();
    }
  }

  sendVerificationCode(): void {
    const email = this.forgotPasswordForm.get('email')!.value;
    if (!email) return;

    this.isLoading = true;
    this.forgotPasswordError = '';

    this.http.post('http://localhost:5000/api/login/forgot-password', { email }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.forgotPasswordStep = 'code';
        this.successMessage = 'Verification code sent to your email!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.forgotPasswordError = 'Failed to send verification code';
        setTimeout(() => this.forgotPasswordError = '', 5000);
      }
    });
  }

  verifyCode(): void {
    const email = this.forgotPasswordForm.get('email')!.value;
    const code = this.forgotPasswordForm.get('code')!.value;
    if (!email || !code) return;

    this.isLoading = true;
    this.forgotPasswordError = '';

    this.http.post('http://localhost:5000/api/login/verify-code', { email, code }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.forgotPasswordStep = 'reset';
        this.successMessage = 'Code verified! Enter your new password.';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.forgotPasswordError = err.error?.message || 'Invalid verification code';
        setTimeout(() => this.forgotPasswordError = '', 5000);
      }
    });
  }

  resetPassword(): void {
    const email = this.forgotPasswordForm.get('email')!.value;
    const code = this.forgotPasswordForm.get('code')!.value;
    const newPassword = this.forgotPasswordForm.get('newPassword')!.value;
    const confirmNewPassword = this.forgotPasswordForm.get('confirmNewPassword')!.value;

    if (newPassword !== confirmNewPassword) {
      this.forgotPasswordError = 'Passwords do not match';
      setTimeout(() => this.forgotPasswordError = '', 5000);
      return;
    }

    this.isLoading = true;
    this.forgotPasswordError = '';

    this.http.post('http://localhost:5000/api/login/reset-password', { email, code, newPassword }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.successMessage = 'Password reset successfully! Please sign in.';
        setTimeout(() => {
          this.closeForgotPassword();
          this.successMessage = '';
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.forgotPasswordError = err.error?.message || 'Failed to reset password';
        setTimeout(() => this.forgotPasswordError = '', 5000);
      }
    });
  }

  // UI helpers
  closePopup(): void {
    try {
      this.dialogRef?.close();
    } catch { }
  }

  toggleSignup($event?: Event): void {
    if ($event) $event.preventDefault();
    this.isLogin = false;
    this.signupAttempted = false;
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.loginError = '';
    this.signupError = '';
    this.successMessage = '';
    this.cdr.detectChanges();
  }

  toggleLogin($event?: Event): void {
    if ($event) $event.preventDefault();
    this.isLogin = true;
    this.showPassword = false;
    this.loginError = '';
    this.signupError = '';
    this.successMessage = '';
    this.cdr.detectChanges();
  }

  dismissError(): void {
    this.loginError = '';
    this.signupError = '';
    this.forgotPasswordError = '';
  }

  dismissSuccess(): void {
    this.successMessage = '';
  }

  // Input formatters
  onAgeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/[^\d]/g, '');
    if (v === '') {
      input.value = '';
      this.signupForm.get('age')!.setValue(null, { emitEvent: false });
      return;
    }
    let n = Math.floor(Number(v));
    if (isNaN(n) || n < 0) n = 0;
    if (n > 120) n = 120;
    input.value = String(n);
    this.signupForm.get('age')!.setValue(n, { emitEvent: false });
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/[^\d+]/g, '');
    v = v.split('').filter((ch, i) => ch !== '+' || i === 0).join('');
    if (v.startsWith('+')) v = v.slice(0, 1 + 12);
    else v = v.slice(0, 12);
    input.value = v;
    this.signupForm.get('phone')!.setValue(v, { emitEvent: false });
  }

  onCnicInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = (input.value || '').replace(/\D/g, '').slice(0, 13);
    const p1 = digits.slice(0, 5), p2 = digits.slice(5, 12), p3 = digits.slice(12);
    let out = p1;
    if (p2) out += '-' + p2;
    if (p3) out += '-' + p3;
    input.value = out;
    this.signupForm.get('cnic')!.setValue(out, { emitEvent: false });
  }

  // Scroll fade state
  private updateFadeState(): void {
    const el = this.contentBody?.nativeElement;
    if (!el) return;
    const scrollTop = el.scrollTop;
    const scrollHeight = el.scrollHeight;
    const clientHeight = el.clientHeight;
    const atTop = scrollTop <= 8;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 8;

    const contentSide = el.closest('.content-panel') as HTMLElement | null;
    if (!contentSide) return;

    if (!atTop) this.renderer.addClass(contentSide, 'has-top-fade');
    else this.renderer.removeClass(contentSide, 'has-top-fade');

    if (!atBottom) this.renderer.addClass(contentSide, 'has-bottom-fade');
    else this.renderer.removeClass(contentSide, 'has-bottom-fade');

    this.cdr.detectChanges();
  }
}
