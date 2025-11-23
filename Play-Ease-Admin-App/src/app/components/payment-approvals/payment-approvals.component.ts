import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxButtonModule } from 'devextreme-angular';
import { PaymentApprovalService, PendingApproval } from '../../services/payment-approval.service';
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';
import { AlertService } from '../../services/alert.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-payment-approvals',
  standalone: true,
  imports: [CommonModule, DxButtonModule],
  templateUrl: './payment-approvals.component.html',
  styleUrl: './payment-approvals.component.css'
})
export class PaymentApprovalsComponent implements OnInit, OnDestroy {
  ownerId: number = 0;
  pendingApprovals: PendingApproval[] = [];
  isLoading = false;
  private refreshSubscription?: Subscription;

  constructor(
    private approvalService: PaymentApprovalService,
    private dataService: GetDatabyDatasourceService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('loggedInUser');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        const userId = p.userID;
        this.loadOwnerId(userId);
      } catch {}
    }

    // Auto-refresh every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      if (this.ownerId > 0) {
        this.loadPendingApprovals();
      }
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  loadOwnerId(userId: number): void {
    const whereclause = `co.userid = ${userId}`;
    this.dataService.getData(5, whereclause).subscribe({
      next: (apiData: any[] | null | undefined) => {
        const ownerData = Array.isArray(apiData) ? apiData : [];
        if (ownerData.length > 0) {
          this.ownerId = ownerData[0].ownerid || ownerData[0].OwnerID;
          this.loadPendingApprovals();
        }
      },
      error: (err: any) => {
        console.error('Error loading owner data:', err);
      }
    });
  }

  loadPendingApprovals(): void {
    if (!this.ownerId) return;
    this.isLoading = true;
    this.approvalService.getPendingApprovals(this.ownerId).subscribe({
      next: (approvals: PendingApproval[]) => {
        this.pendingApprovals = approvals;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading pending approvals:', err);
        this.alertService.error('Failed to load pending approvals');
        this.isLoading = false;
      }
    });
  }

  approvePayment(bookingId: number): void {
    if (!confirm('Are you sure you want to approve this payment?')) return;

    this.approvalService.approvePayment(bookingId).subscribe({
      next: () => {
        this.alertService.success('Payment approved! Booking confirmed.');
        this.loadPendingApprovals();
      },
      error: (err: any) => {
        console.error('Error approving payment:', err);
        this.alertService.error(err?.error?.error || 'Failed to approve payment');
      }
    });
  }

  rejectPayment(bookingId: number): void {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    this.approvalService.rejectPayment(bookingId, reason || '').subscribe({
      next: () => {
        this.alertService.warning('Payment rejected. Booking cancelled.');
        this.loadPendingApprovals();
      },
      error: (err: any) => {
        console.error('Error rejecting payment:', err);
        this.alertService.error(err?.error?.error || 'Failed to reject payment');
      }
    });
  }

  getPaymentProofUrl(proofPath: string): string {
    if (!proofPath) return '';
    const baseUrl = 'http://localhost:5000';
    return proofPath.startsWith('http') ? proofPath : `${baseUrl}/${proofPath}`;
  }

  formatTimeRemaining(timeRemaining: string): string {
    if (timeRemaining === 'Expired') return '⏰ Expired';
    return `⏱️ ${timeRemaining} remaining`;
  }
}

