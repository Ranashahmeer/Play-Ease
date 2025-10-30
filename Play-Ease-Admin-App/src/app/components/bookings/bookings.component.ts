import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Court } from '../../models/setupModels';
import { SearchFilterComponent } from '../searh-bar/searh-bar.component';
import { CourtListComponent } from '../court-booking/court-booking.component';

import { CourtDetailsPopupComponent } from '../booking-details/booking-details.component';
import { PaymentBookingComponent } from '../payment/payment.component';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule,
    SearchFilterComponent,
    CourtListComponent,
    CourtDetailsPopupComponent,
    PaymentBookingComponent
  ],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.css',
})
export class BookingsComponent implements OnInit {
  @ViewChild(SearchFilterComponent) searchFilterComp!: SearchFilterComponent;
  @ViewChild(CourtListComponent) courtListComp!: CourtListComponent;
  @ViewChild(CourtDetailsPopupComponent) courtDetailsComp!: CourtDetailsPopupComponent;
  @ViewChild(PaymentBookingComponent) paymentComp!: PaymentBookingComponent;

  private subscriptions: Subscription[] = [];
  courts: Court[] = [];
  form!: FormGroup;
  isBrowser = false;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {}

  onCourtsLoaded(courts: Court[]): void {
    this.courts = courts;
    if (this.searchFilterComp) {
      this.searchFilterComp.courts = courts;
    }
  }

  onFilteredCourtsChange(filtered: Court[]): void {
    if (this.courtListComp) {
      this.courtListComp.setFilteredCourts(filtered);
      this.courtListComp.setNoCourtsMessage(
        filtered.length === 0 ? 'No courts available for selected time and duration.' : ''
      );
    }
  }

  onCourtSelected(court: Court): void {
    if (this.courtDetailsComp && this.form) {
      const sidebarDate = this.form.get('selectedDate')?.value;
      this.courtDetailsComp.openCourtDetails(court, sidebarDate);
    }
  }

  onDurationChange(minutes: number): void {
    if (this.courtDetailsComp && this.courtDetailsComp.popupVisible) {
      this.courtDetailsComp.recomputeAvailability();
    }
    if (this.searchFilterComp) {
      this.searchFilterComp.recomputeSidebarTimeOptions();
    }
  }

  onFormChange(form: FormGroup): void {
    this.form = form;
    
    const s1 = this.form.get('matchDuration')!.valueChanges.subscribe(() => {
      this.onDurationChange(this.form.get('matchDuration')?.value);
    });
    const s2 = this.form.get('selectedDate')!.valueChanges.subscribe(() => {
      if (this.searchFilterComp) {
        this.searchFilterComp.recomputeSidebarTimeOptions();
      }
    });
    this.subscriptions.push(s1, s2);
  }

  onProceedToPayment(data: any): void {
    if (this.paymentComp) {
      this.paymentComp.selectedCourt = data.court;
      this.paymentComp.selectedBookingDate = data.date;
      this.paymentComp.selectedBookingTime = data.time;
      this.paymentComp.selectedPitchSize = data.pitchSize;
      this.paymentComp.openPaymentReview();
    }
    if (this.courtDetailsComp) {
      this.courtDetailsComp.popupVisible = false;
    }
  }

  onBackToDetails(): void {
    if (this.courtDetailsComp) {
      this.courtDetailsComp.popupVisible = true;
    }
  }

  onBookingComplete(): void {
    if (this.courtDetailsComp) {
      this.courtDetailsComp.popupVisible = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    if (this.paymentComp) {
      this.paymentComp.stopReservationTimer();
    }
  }
}