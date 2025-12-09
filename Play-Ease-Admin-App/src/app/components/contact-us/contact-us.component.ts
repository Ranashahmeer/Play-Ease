import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DxButtonModule, DxFileUploaderModule, DxLoadIndicatorModule } from 'devextreme-angular';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DxButtonModule, DxFileUploaderModule, DxLoadIndicatorModule],
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.css']
})
export class ContactUsComponent {
  contactForm: FormGroup;
  isSubmitting = false;
  selectedFile: File | null = null;

  categories = [
    'General Inquiry',
    '⭐ Register as Court Owner',
    'Court Booking Issue',
    'Payment Query',
    'Technical Support',
    'Feedback/Suggestions'
  ];

  private apiUrl = 'http://localhost:5000/api/Contact';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private alertService: AlertService
  ) {
    this.contactForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern(/^\+92[0-9]{10}$/)]],
      category: ['', Validators.required],
      subject: ['', [Validators.required, Validators.minLength(5)]],
      message: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]]
    });
  }


  onFileSelected(event: any): void {
    console.log('Full file event:', event);
    console.log('Event value:', event.value);
    console.log('Event component:', event.component);

    // Try multiple ways to get the file
    if (event.value && event.value.length > 0) {
      // Method 1: Direct from value array
      this.selectedFile = event.value[0];
      console.log('Method 1 - Selected file from value:', this.selectedFile);
    } else if (event.component) {
      // Method 2: From component's files
      const files = event.component.option('value');
      if (files && files.length > 0) {
        this.selectedFile = files[0];
        console.log('Method 2 - Selected file from component:', this.selectedFile);
      }
    }

    if (this.selectedFile) {
      console.log('File successfully selected:', {
        name: this.selectedFile.name,
        size: this.selectedFile.size,
        type: this.selectedFile.type
      });
    } else {
      console.error('Failed to extract file from event');
      this.selectedFile = null;
    }
  }

  formatPhoneNumber(event: any): void {
    let value = event.target.value.replace(/[^\d]/g, '');

    if (!value.startsWith('92')) {
      if (value.startsWith('0')) {
        value = '92' + value.substring(1);
      } else if (value.startsWith('3')) {
        value = '92' + value;
      }
    }

    if (value.length > 12) {
      value = value.substring(0, 12);
    }

    const formattedValue = value ? '+' + value : '';
    this.contactForm.patchValue({ phoneNumber: formattedValue }, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.markFormGroupTouched(this.contactForm);
      this.alertService.error('Please fill all required fields correctly.');
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('fullName', this.contactForm.value.fullName);
    formData.append('email', this.contactForm.value.email);
    formData.append('phoneNumber', this.contactForm.value.phoneNumber || '');
    formData.append('category', this.contactForm.value.category);
    formData.append('subject', this.contactForm.value.subject);
    formData.append('message', this.contactForm.value.message);

    if (this.selectedFile) {
      console.log('Appending file to FormData:', this.selectedFile.name, this.selectedFile.size);
      formData.append('attachment', this.selectedFile, this.selectedFile.name);
    } else {
      console.log('No file selected');
    }

    console.log('Submitting form data to:', `${this.apiUrl}/submit`);

    this.http.post(`${this.apiUrl}/submit`, formData).subscribe({
      next: (response: any) => {
        console.log('Success response:', response);
        this.alertService.success(response.message || 'Message sent successfully!');
        this.contactForm.reset();
        this.selectedFile = null;
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Error submitting contact form:', err);
        this.alertService.error(err.error?.error || 'Failed to send message. Please try again.');
        this.isSubmitting = false;
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get f() {
    return this.contactForm.controls;
  }
}
