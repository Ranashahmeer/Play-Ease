import { Component, OnInit, OnDestroy, OnChanges, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsService, Notification } from '../../services/notifications/notifications.service';
import { Subscription, interval } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css'
})
export class NotificationBellComponent implements OnInit, OnDestroy, OnChanges {
  @Input() userId: number = 0;

  notifications: Notification[] = [];
  unreadCount: number = 0;
  showDropdown: boolean = false;
  isLoading: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private notificationsService: NotificationsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && this.userId > 0) {
      this.loadNotifications();
      this.loadUnreadCount();

      // Poll for new notifications every 30 seconds
      const pollSubscription = interval(30000).subscribe(() => {
        this.loadUnreadCount();
        if (this.showDropdown) {
          this.loadNotifications();
        }
      });
      this.subscriptions.push(pollSubscription);

      // Subscribe to unread count updates
      const countSubscription = this.notificationsService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      });
      this.subscriptions.push(countSubscription);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId'] && !changes['userId'].firstChange && this.userId > 0) {
      this.loadUnreadCount();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadNotifications(): void {
    if (!this.userId) return;
    this.isLoading = true;
    this.notificationsService.getUserNotifications(this.userId, false, 20).subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
        this.isLoading = false;
      }
    });
  }

  loadUnreadCount(): void {
    if (!this.userId) return;
    this.notificationsService.getUnreadCount(this.userId).subscribe({
      next: (count) => {
        this.unreadCount = count;
      },
      error: (err) => {
        console.error('Error loading unread count:', err);
      }
    });
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.loadNotifications();
    }
  }

  markAsRead(notification: Notification): void {
    if (notification.isRead || !this.userId) return;

    this.notificationsService.markAsRead(notification.notificationID, this.userId).subscribe({
      next: () => {
        notification.isRead = true;
        notification.readAt = new Date();
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      },
      error: (err) => {
        console.error('Error marking notification as read:', err);
      }
    });
  }

  markAllAsRead(): void {
    if (!this.userId || this.unreadCount === 0) return;

    this.notificationsService.markAllAsRead(this.userId).subscribe({
      next: () => {
        this.notifications.forEach(n => {
          n.isRead = true;
          n.readAt = new Date();
        });
        this.unreadCount = 0;
      },
      error: (err) => {
        console.error('Error marking all as read:', err);
      }
    });
  }

  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    if (!this.userId) return;

    this.notificationsService.deleteNotification(notification.notificationID, this.userId).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.notificationID !== notification.notificationID);
        if (!notification.isRead) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      },
      error: (err) => {
        console.error('Error deleting notification:', err);
      }
    });
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'match_cancelled':
      case 'error':
        return 'icon-error';
      case 'application_accepted':
      case 'success':
        return 'icon-success';
      case 'application_rejected':
      case 'warning':
        return 'icon-warning';
      case 'application_withdrawn':
        return 'icon-withdrawn';
      case 'new_applicant':
        return 'icon-applicant';
      case 'match_reminder':
        return 'icon-reminder';
      default:
        return 'icon-info';
    }
  }

  getNotificationClass(type: string): string {
    switch (type) {
      case 'match_cancelled':
      case 'error':
        return 'notification-error';
      case 'application_accepted':
      case 'success':
        return 'notification-success';
      case 'application_rejected':
      case 'warning':
        return 'notification-warning';
      default:
        return 'notification-info';
    }
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }
}

