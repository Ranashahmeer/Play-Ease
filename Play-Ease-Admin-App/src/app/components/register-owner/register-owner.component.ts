import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { OwnerService, RegisterOwnerDto } from '../../services/owner.service';
import { AlertService } from '../../services/alert.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { PaymentMethodService, PaymentMethod, OwnerPaymentMethod } from '../../services/payment-method.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register-owner',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './register-owner.component.html',
  styleUrl: './register-owner.component.css'
})
export class RegisterOwnerComponent implements OnInit {
  registerForm!: FormGroup;
  submitted = false;
  loading = false;
  showPassword = false;
  showConfirmPassword = false;
  emailChecking = false;
  emailExists = false;

  // Payment method properties
  availablePaymentMethods: PaymentMethod[] = [];
  ownerPaymentMethods: OwnerPaymentMethod[] = [];

  constructor(
    private fb: FormBuilder,
    private ownerService: OwnerService,
    private alertService: AlertService,
    private router: Router,
    private paymentMethodService: PaymentMethodService
  ) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email], [this.emailExistsValidator.bind(this)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+92[0-9]{10}$/)]],
      cnic: ['', [Validators.required, Validators.pattern(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      age: ['', [Validators.min(18), Validators.max(100)]]
    }, { validators: this.passwordMatchValidator });

    // Load available payment methods
    this.loadPaymentMethods();
  }

  // Custom validator for password match
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  // Async validator for email uniqueness
  emailExistsValidator(control: AbstractControl) {
    if (!control.value) {
      return of(null);
    }

    this.emailChecking = true;
    return of(control.value).pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(email => this.ownerService.checkEmailExists(email)),
      switchMap(result => {
        this.emailChecking = false;
        this.emailExists = result.exists;
        return of(result.exists ? { emailExists: true } : null);
      })
    );
  }

  // Format CNIC input with dashes
  formatCNIC(event: any): void {
    let value = event.target.value.replace(/[^0-9]/g, '');

    if (value.length > 5) {
      value = value.slice(0, 5) + '-' + value.slice(5);
    }
    if (value.length > 13) {
      value = value.slice(0, 13) + '-' + value.slice(13);
    }
    if (value.length > 15) {
      value = value.slice(0, 15);
    }

    this.registerForm.patchValue({ cnic: value }, { emitEvent: false });
  }

  // Format phone input
  formatPhone(event: any): void {
    let value = event.target.value.replace(/[^0-9+]/g, '');

    if (!value.startsWith('+92')) {
      if (value.startsWith('92')) {
        value = '+' + value;
      } else if (value.startsWith('0')) {
        value = '+92' + value.slice(1);
      } else if (value.length > 0 && !value.startsWith('+')) {
        value = '+92' + value;
      }
    }

    if (value.length > 13) {
      value = value.slice(0, 13);
    }

    this.registerForm.patchValue({ phone: value }, { emitEvent: false });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getPasswordStrength(): string {
    const password = this.registerForm.get('password')?.value || '';
    if (password.length === 0) return '';
    if (password.length < 6) return 'weak';
    if (password.length < 8) return 'medium';
    if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) return 'strong';
    return 'medium';
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.registerForm.invalid) {
      this.alertService.error('Please fill in all required fields correctly.');
      return;
    }

    this.loading = true;

    const dto: RegisterOwnerDto = {
      fullName: this.registerForm.value.fullName,
      email: this.registerForm.value.email,
      phone: this.registerForm.value.phone,
      cnic: this.registerForm.value.cnic,
      password: this.registerForm.value.password,
      age: this.registerForm.value.age || undefined
    };

    this.ownerService.registerOwner(dto).subscribe({
      next: async (response) => {
        // Save payment methods if any were added
        if (this.ownerPaymentMethods.length > 0) {
          const paymentsSaved = await this.savePaymentMethods(response.ownerID);

          if (paymentsSaved) {
            this.alertService.success(`Court owner and payment methods registered successfully! Owner ID: ${response.ownerID}`);
          } else {
            this.alertService.warning(`Owner registered (ID: ${response.ownerID}) but payment methods failed to save. Please add them later.`);
          }
        } else {
          this.alertService.success(`Court owner registered successfully! Owner ID: ${response.ownerID}`);
        }

        this.registerForm.reset();
        this.submitted = false;
        this.loading = false;
        this.ownerPaymentMethods = []; // Clear payment methods

        // Navigate back to account page after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/my-account']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.alertService.error(err.error?.message || 'Failed to register owner. Please try again.');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/my-account']);
  }

  // Getter for easy access to form fields
  get f() {
    return this.registerForm.controls;
  }

  // ===== Payment Method Functions =====

  loadPaymentMethods(): void {
    this.paymentMethodService.getPaymentMethods().subscribe({
      next: (methods) => {
        this.availablePaymentMethods = methods;
      },
      error: (err) => {
        console.error('Error loading payment methods:', err);
        this.alertService.error('Failed to load payment methods');
      }
    });
  }

  addPaymentMethod(): void {
    const newPayment: OwnerPaymentMethod = {
      ownerID: 0,  // Will be set after owner is created
      methodID: 0,
      accountTitle: '',
      accountNumber: '',
      bankName: ''
    };
    this.ownerPaymentMethods.push(newPayment);
  }

  removePaymentMethod(index: number): void {
    this.ownerPaymentMethods.splice(index, 1);
  }

  validatePaymentMethods(): boolean {
    if (this.ownerPaymentMethods.length === 0) {
      this.alertService.error('Please add at least one payment method');
      return false;
    }

    for (let i = 0; i < this.ownerPaymentMethods.length; i++) {
      const payment = this.ownerPaymentMethods[i];

      if (!payment.methodID || payment.methodID === 0) {
        this.alertService.error(`Please select payment type for payment method #${i + 1}`);
        return false;
      }

      if (!payment.accountTitle || payment.accountTitle.trim().length < 3) {
        this.alertService.error(`Please enter valid account title for payment method #${i + 1} (minimum 3 characters)`);
        return false;
      }

      if (!payment.accountNumber || payment.accountNumber.trim().length < 5) {
        this.alertService.error(`Please enter valid account number for payment method #${i + 1} (minimum 5 characters)`);
        return false;
      }

      // Validate Bank Name for Bank Transfer (MethodID = 3)
      if (payment.methodID === 3 && (!payment.bankName || payment.bankName.trim().length === 0)) {
        this.alertService.error(`Please enter bank name for payment method #${i + 1}`);
        return false;
      }
    }

    return true;
  }

  async savePaymentMethods(ownerId: number): Promise<boolean> {
    if (!this.validatePaymentMethods()) {
      return false;
    }

    const payments = this.ownerPaymentMethods.map(p => ({
      ownerID: ownerId,
      methodID: p.methodID,
      accountTitle: p.accountTitle.trim(),
      accountNumber: p.accountNumber.trim(),
      bankName: p.methodID === 3 ? p.bankName?.trim() : undefined
    }));

    try {
      await this.paymentMethodService.createOwnerPaymentsBulk(payments).toPromise();
      return true;
    } catch (error) {
      console.error('Error saving payment methods:', error);
      this.alertService.error('Failed to save payment methods');
      return false;
    }
  }

  getPaymentMethodName(methodID: number): string {
    const method = this.availablePaymentMethods.find(m => m.methodID === methodID);
    return method ? method.methodName : '';
  }
}
