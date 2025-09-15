import { Component, OnInit, Inject, ChangeDetectorRef, AfterViewInit, ViewChild, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormGroup, Validators, FormBuilder, ValidatorFn, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription, fromEvent } from 'rxjs';
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
  signupAttempted = false;

  // Forms
  loginForm!: FormGroup;
  signupForm!: FormGroup;

  // scroll fade state
  private scrollSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    @Inject(MatDialogRef) private dialogRef?: MatDialogRef<LoginComponent>,
    @Inject(MAT_DIALOG_DATA) private dialogData?: any
  ) {}

  ngOnInit(): void {
    // Login form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['player', [Validators.required]]
    });

    // Signup form
    this.signupForm = this.fb.group({
      accountType: ['player', [Validators.required]],
      name: ['', []],
      age: [null, []],
      phone: ['', []],
      cnic: ['', []],
      email: ['', []],
      password: ['', []],
      confirmPassword: ['', []]
    }, { validators: [this.matchPasswordsValidator('password','confirmPassword')] });

    this.applySignupValidators(this.signupForm.get('accountType')!.value);
    this.signupForm.get('accountType')!.valueChanges.subscribe(val => this.applySignupValidators(val));
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
  }

  // Convenience getters for template
  get loginControls(): any { return this.loginForm.controls; }
  get signupControls(): any { return this.signupForm.controls; }

  // Form valid flags used by template (keeps binding simple)
  get isLoginValid(): boolean { return this.loginForm.valid; }
  get isSignupValid(): boolean {
    const gmErr = (this.signupForm.errors as any) || {};
    return this.signupForm.valid && !gmErr.passwordMismatch;
  }

  // Apply validators depending on account type
  applySignupValidators(accountType: string) {
    const name = this.signupForm.get('name')!;
    const age = this.signupForm.get('age')!;
    const phone = this.signupForm.get('phone')!;
    const cnic = this.signupForm.get('cnic')!;
    const email = this.signupForm.get('email')!;
    const password = this.signupForm.get('password')!;
    const confirmPassword = this.signupForm.get('confirmPassword')!;

    [name, age, phone, cnic, email, password, confirmPassword].forEach(c => c.clearValidators());

    name.setValidators([Validators.required, Validators.minLength(2), Validators.pattern(/^[A-Za-z\s]+$/)]);
    const minAge = accountType === 'owner' ? 18 : 10;
    age.setValidators([Validators.required, Validators.min(minAge), Validators.max(120)]);
    phone.setValidators([Validators.required, Validators.pattern(/^(?:\+92|92|0)?3\d{9}$/)]);
    email.setValidators([Validators.required, Validators.email]);
    password.setValidators([Validators.required, Validators.minLength(6), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).{6,}$/)]);
    confirmPassword.setValidators([Validators.required]);

    if (accountType === 'owner') {
      cnic.setValidators([Validators.required, Validators.pattern(/^\d{5}-\d{7}-\d$/)]);
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

  // LOGIN handler
  handleLogin(): void {
    this.loginForm.markAllAsTouched();
    if (!this.loginForm.valid) return;
  
    const { email, password, role } = this.loginForm.value;
  
    this.authService.login({ email, password, role }).subscribe({
      next: (res) => {
        // assuming your .NET API returns success + user info
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loggedInUser', JSON.stringify(res));
        alert('Login successful!');
        try { this.dialogRef?.close(); } catch {}
        this.router.navigate(['/my-account']);
        
      },
      error: (err) => {
        console.error(err);
        alert('Invalid email / password / role.');
      }
    });
  }
  

  // SIGNUP handler
  handleSignup(): void {
    this.signupAttempted = true;
    this.signupForm.markAllAsTouched();
  
    if (!this.isSignupValid) {
      if (this.signupForm.errors && (this.signupForm.errors as any).passwordMismatch) {
        alert('Passwords do not match.');
      } else {
        alert('Please correct the highlighted fields.');
      }
      return;
    }
  
    const accountType = this.signupForm.get('accountType')!.value as 'player'|'owner';
    const age = Number(this.signupForm.get('age')!.value);
  
    if (accountType === 'player' && age < 10) { alert('Players must be at least 10.'); return; }
    if (accountType === 'owner' && age < 18) { alert('Owners must be at least 18.'); return; }
  
    const userPayload = {
      fullName: String(this.signupForm.get('name')!.value || '').trim(),
      phone: String(this.signupForm.get('phone')!.value || '').trim(),
      email: String(this.signupForm.get('email')!.value || '').trim().toLowerCase(),
      password: this.signupForm.get('password')!.value,
      age: this.signupForm.get('age')!.value,
      cnic: this.signupForm.get('cnic')!.value,
      roleID: accountType === 'player' ? 2 : 3 // 2: player, 3: owner
    };
  
    this.authService.register(userPayload).subscribe({
      next: (res:any) => {
        alert('Signup successful — please login.');
        this.toggleLogin();
        this.signupForm.reset({ accountType: 'player' });
        this.applySignupValidators('player');
        this.signupAttempted = false;
      },
      error: (err:any) => {
        console.error('Signup error:', err);
        if (err?.error?.message) alert(err.error.message);
        else alert('Signup failed. Please try again.');
      }
    });
  }
  
  // UI helpers
  closePopup(): void { try { this.dialogRef?.close(); } catch {} }
  toggleSignup($event?: Event): void { if ($event) $event.preventDefault(); this.isLogin = false; this.cdr.detectChanges(); }
  toggleLogin($event?: Event): void { if ($event) $event.preventDefault(); this.isLogin = true; this.cdr.detectChanges(); }

  // Input formatters
  onAgeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/[^\d]/g, '');
    if (v === '') { input.value=''; this.signupForm.get('age')!.setValue(null, { emitEvent:false }); return; }
    let n = Math.floor(Number(v)); if (isNaN(n) || n < 0) n = 0; if (n > 120) n = 120;
    input.value = String(n);
    this.signupForm.get('age')!.setValue(n, { emitEvent:false });
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/[^\d+]/g, '');
    v = v.split('').filter((ch,i)=> ch !== '+' || i===0).join('');
    if (v.startsWith('+')) v = v.slice(0, 1+12); else v = v.slice(0, 12);
    input.value = v;
    this.signupForm.get('phone')!.setValue(v, { emitEvent:false });
  }

  onCnicInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = (input.value || '').replace(/\D/g,'').slice(0,13);
    const p1 = digits.slice(0,5), p2 = digits.slice(5,12), p3 = digits.slice(12);
    let out = p1; if (p2) out += '-' + p2; if (p3) out += '-' + p3;
    input.value = out;
    this.signupForm.get('cnic')!.setValue(out, { emitEvent:false });
  }

  // Scroll fade state (conditionally add/remove classes)
  private updateFadeState(): void {
    const el = this.contentBody?.nativeElement;
    if (!el) return;
    const scrollTop = el.scrollTop;
    const scrollHeight = el.scrollHeight;
    const clientHeight = el.clientHeight;
    const atTop = scrollTop <= 8;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 8;

    const contentSide = el.closest('.content-side') as HTMLElement | null;
    if (!contentSide) return;

    if (!atTop) this.renderer.addClass(contentSide, 'has-top-fade'); else this.renderer.removeClass(contentSide, 'has-top-fade');
    if (!atBottom) this.renderer.addClass(contentSide, 'has-bottom-fade'); else this.renderer.removeClass(contentSide, 'has-bottom-fade');

    this.cdr.detectChanges();
  }
}
