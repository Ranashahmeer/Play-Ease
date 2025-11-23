import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AlertService, Alert } from '../../services/alert.service';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css',
  encapsulation: ViewEncapsulation.None
})
export class AlertComponent implements OnInit, OnDestroy {
  alerts: Alert[] = [];
  private subscription?: Subscription;

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    this.subscription = this.alertService.alerts$.subscribe(alert => {
      this.alerts.push(alert);
      if (alert.duration && alert.duration > 0) {
        setTimeout(() => {
          this.removeAlert(alert.id);
        }, alert.duration);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  removeAlert(id: string): void {
    this.alerts = this.alerts.filter(alert => alert.id !== id);
  }
}

