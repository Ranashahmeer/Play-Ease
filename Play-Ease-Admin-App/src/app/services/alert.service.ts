import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface Alert {
  id: string;
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertSubject = new Subject<Alert>();
  public alerts$: Observable<Alert> = this.alertSubject.asObservable();

  show(message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error', duration: number = 5000): void {
    const alert: Alert = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      message,
      duration
    };
    this.alertSubject.next(alert);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }
}

