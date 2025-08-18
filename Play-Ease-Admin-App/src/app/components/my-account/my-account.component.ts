import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

interface Booking {
  id: number;
  courtName: string;
  date: string;      // e.g. "2025-08-20"
  time: string;      // e.g. "07:00 PM"
  duration: string;  // e.g. "90 mins"
  location: string;
  price?: number;
  image?: string;
  status?: 'upcoming' | 'completed';
}

@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.css']
})
export class MyAccountComponent implements OnInit {
  // Read-only user profile (display-only)
  user = {
    name: 'John Doe',
    age: 28,
    contact: '+92 300 1234567',
    email: 'johndoe@example.com',
  };

  // Only password + team forms are used
  passwordForm!: FormGroup;
  teamForm!: FormGroup;

  // Bookings data
  upcomingBookings: Booking[] = [];
  pastBookings: Booking[] = [];

  // UI state
  showTeamModal = false;
  pwdMessage = { text: '', type: '' as 'success' | 'error' | '' };

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // password form
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });

    // team request form
    this.teamForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(10)]],
      phone: [this.user.contact, Validators.required]
    });

    // load profile from localStorage if present (display-only)
    const saved = localStorage.getItem('myAccountProfile');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        this.user = { ...this.user, ...p };
      } catch { /* ignore parse errors */ }
    }

    // Example bookings (demo)
    this.upcomingBookings = [
      { id: 1, courtName: 'Alpha Arena', date: '2025-08-20', time: '06:00 PM', duration: '90 mins', location: 'Gulberg', price: 2700, image: 'assets/alphaarena-1.jpg', status: 'upcoming' },
      { id: 2, courtName: 'Beta Grounds', date: '2025-08-25', time: '08:00 PM', duration: '60 mins', location: 'DHA', price: 1800, image: 'assets/betaground-1.jpg', status: 'upcoming' }
    ];
    this.pastBookings = [
      { id: 11, courtName: 'Omega Turf', date: '2025-07-21', time: '06:00 PM', duration: '60 mins', location: 'Nazimabad', price: 1900, image: 'assets/omegaturf-1.jpg', status: 'completed' }
    ];
  }

  // Change password (local placeholder)
  changePassword(): void {
    this.pwdMessage = { text: '', type: '' };

    if (this.passwordForm.invalid) {
      this.pwdMessage = { text: 'Please complete the form correctly.', type: 'error' };
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.pwdMessage = { text: 'New password and confirmation do not match.', type: 'error' };
      return;
    }

    // If you use local users store, verify and update it; otherwise simulate success
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const idx = users.findIndex((u: any) => u.email === this.user.email);

    if (idx === -1) {
      // no persisted user found — show success to proceed with flow
      this.passwordForm.reset();
      this.pwdMessage = { text: 'Password accepted locally. (Will sync with backend later.)', type: 'success' };
      return;
    }

    if (users[idx].password !== currentPassword) {
      this.pwdMessage = { text: 'Current password is incorrect.', type: 'error' };
      return;
    }

    users[idx].password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));
    this.passwordForm.reset();
    this.pwdMessage = { text: 'Password updated (local).', type: 'success' };
  }

  // Cancel upcoming booking (local demo)
  cancelUpcoming(bookingId: number): void {
    if (!confirm('Are you sure you want to cancel this booking? There will be no Refund!!')) return;
    this.upcomingBookings = this.upcomingBookings.filter(b => b.id !== bookingId);
    // TODO: call backend to cancel
  }

  // Team modal actions
  toggleTeamModal(open = true) {
    this.showTeamModal = open;
    if (!open) {
      this.teamForm.reset({ phone: this.user.contact });
    }
  }

  sendTeamRequest(): void {
    if (this.teamForm.invalid) {
      alert('Please provide a message (min 10 chars) and contact number.');
      return;
    }
    // store or send to backend later
    console.log('Team request:', this.teamForm.value);
    this.toggleTeamModal(false);
    alert('Team request submitted. We will contact you soon.');
  }

  get hasNoBookings(): boolean {
    return this.upcomingBookings.length === 0 && this.pastBookings.length === 0;
  }
}
