import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { GetDatabyDatasourceService } from '../../services/get-data/get-databy-datasource.service';
import {
  DxChartModule,
  DxPieChartModule,
  DxBarGaugeModule,
  DxCircularGaugeModule,
  DxButtonModule
} from 'devextreme-angular';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DxChartModule,
    DxPieChartModule,
    DxBarGaugeModule,
    DxCircularGaugeModule,
    DxButtonModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  userRole: string = '';
  userId?: number;
  roleId?: number;
  subscriptions: Subscription[] = [];

  // Chart data containers
  charts: {
    [key: string]: {
      dataSource: any[];
      loading: boolean;
      error?: string;
    };
  } = {
    userRegistration: { dataSource: [], loading: false },
    roleDistribution: { dataSource: [], loading: false },
    matchTrends: { dataSource: [], loading: false },
    applicationStatus: { dataSource: [], loading: false },
    revenueByCourt: { dataSource: [], loading: false },
    bookingTrends: { dataSource: [], loading: false },
    revenueByOwner: { dataSource: [], loading: false },
    bookingTimeSlot: { dataSource: [], loading: false },
    topMatches: { dataSource: [], loading: false },
    paymentMethods: { dataSource: [], loading: false },
    activeUsers: { dataSource: [], loading: false },
    monthlyRevenue: { dataSource: [], loading: false }
  };

  // KPI values
  kpis = {
    totalUsers: 0,
    totalRevenue: 0,
    activeBookings: 0,
    totalMatches: 0,
    acceptanceRate: 0,
    avgBookingValue: 0
  };

  constructor(
    private dataService: GetDatabyDatasourceService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    // loadDashboardData() will be called automatically after getUserRole() completes
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadUserInfo(): void {
    const saved = localStorage.getItem('loggedInUser');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        this.userId = user.userID;
        this.roleId = user.roleID;
        this.getUserRole();
      } catch (e) {
        // Error parsing user data
      }
    }
  }

  getUserRole(): void {
    const sub = this.dataService.getData(4).subscribe({
      next: (roles: any[]) => {
        const role = roles?.find(r => r.RoleID === this.roleId);
        this.userRole = role?.RoleName || 'User';
        this.loadDashboardData();
      },
      error: (err) => {
        // Default to 'User' if role loading fails
        this.userRole = 'User';
        this.loadDashboardData();
      }
    });
    this.subscriptions.push(sub);
  }

  loadDashboardData(): void {
    if (!this.userRole) {
      // Wait for role to load
      return;
    }

    // Role-specific charts only
    if (this.userRole === 'Admin') {
      this.loadAdminCharts();
    } else if (this.userRole === 'Owner') {
      this.loadOwnerCharts();
    } else {
      this.loadUserCharts();
    }

    // Load KPIs
    this.loadKPIs();
  }

  loadAdminCharts(): void {
    // Admin-only overview charts
    this.loadChart(9, 'userRegistration', 'User registration trends');
    this.loadChart(10, 'roleDistribution', 'Role distribution');
    this.loadChart(12, 'applicationStatus', 'Application status');
    this.loadChart(19, 'activeUsers', 'Active vs Inactive users');
    // Admin business charts
    this.loadChart(11, 'matchTrends', 'Match creation trends');
    this.loadChart(13, 'revenueByCourt', 'Revenue by court');
    this.loadChart(14, 'bookingTrends', 'Booking trends');
    this.loadChart(15, 'revenueByOwner', 'Revenue by owner');
    this.loadChart(16, 'bookingTimeSlot', 'Bookings by time slot');
    this.loadChart(17, 'topMatches', 'Top matches by applicants');
    this.loadChart(18, 'paymentMethods', 'Payment methods');
    this.loadChart(20, 'monthlyRevenue', 'Monthly revenue trends');
  }

  loadOwnerCharts(): void {
    // Owner-specific charts - only their own data
    if (!this.userId) return;
    
    // DataSource 13 has no WHERE, so use WHERE
    const courtWhereClause = `co.OwnerID = (SELECT OwnerID FROM courtowners WHERE UserId = ${this.userId})`;
    // DataSource 14 already has WHERE IsActive = 1, so use AND
    const bookingWhereClause = `AND b.CourtId IN (SELECT CourtID FROM courts WHERE OwnerID = (SELECT OwnerID FROM courtowners WHERE UserId = ${this.userId}))`;
    // DataSource 16 already has WHERE IsActive = 1, so use AND
    const timeSlotWhereClause = `AND CourtId IN (SELECT CourtID FROM courts WHERE OwnerID = (SELECT OwnerID FROM courtowners WHERE UserId = ${this.userId}))`;
    // DataSource 20 already has WHERE IsActive = 1, so use AND
    const monthlyWhereClause = `AND CourtId IN (SELECT CourtID FROM courts WHERE OwnerID = (SELECT OwnerID FROM courtowners WHERE UserId = ${this.userId}))`;
    
    this.loadChart(13, 'revenueByCourt', 'My Court Revenue', courtWhereClause);
    this.loadChart(14, 'bookingTrends', 'My Booking Trends', bookingWhereClause);
    this.loadChart(16, 'bookingTimeSlot', 'My Bookings by Time', timeSlotWhereClause);
    this.loadChart(20, 'monthlyRevenue', 'My Monthly Revenue', monthlyWhereClause);
  }

  loadUserCharts(): void {
    // User-specific charts - only their own data
    if (!this.userId) return;
    
    // DataSource 14 already has WHERE IsActive = 1, so use AND
    const bookingWhereClause = `AND UserID = ${this.userId}`;
    // DataSource 11 has no WHERE, so use WHERE
    const matchWhereClause = `OrganizerId = ${this.userId}`;
    // DataSource 12 has no WHERE, so use WHERE
    const applicationWhereClause = `user_id = ${this.userId}`;
    // DataSource 17 has no WHERE, so use WHERE
    const matchesAppliedWhereClause = `a.user_id = ${this.userId}`;
    
    this.loadChart(14, 'bookingTrends', 'My Booking History', bookingWhereClause);
    this.loadChart(11, 'matchTrends', 'Matches I Created', matchWhereClause);
    this.loadChart(12, 'applicationStatus', 'My Application Status', applicationWhereClause);
    this.loadChart(17, 'topMatches', 'Matches I Applied To', matchesAppliedWhereClause);
  }

  loadChart(dataSourceId: number, chartKey: string, chartName: string, whereClause: string = ''): void {
    this.charts[chartKey].loading = true;
    this.charts[chartKey].error = undefined;

    const sub = this.dataService.getData(dataSourceId, whereClause).subscribe({
      next: (data: any[]) => {
        this.charts[chartKey].dataSource = Array.isArray(data) ? data : [];
        this.charts[chartKey].loading = false;
      },
      error: (err) => {
        this.charts[chartKey].error = `Failed to load ${chartName}`;
        this.charts[chartKey].loading = false;
        this.charts[chartKey].dataSource = [];
      }
    });
    this.subscriptions.push(sub);
  }

  loadKPIs(): void {
    // Total Users
    this.dataService.getData(9).subscribe({
      next: (data: any[]) => {
        if (data && data.length > 0) {
          const last = data[data.length - 1];
          this.kpis.totalUsers = last.CumulativeUsers || 0;
        }
      }
    });

    // Total Revenue
    this.dataService.getData(14).subscribe({
      next: (data: any[]) => {
        if (data && data.length > 0) {
          const total = data.reduce((sum, item) => sum + (item.DailyRevenue || 0), 0);
          const count = data.reduce((sum, item) => sum + (item.BookingCount || 0), 0);
          this.kpis.totalRevenue = total;
          this.kpis.avgBookingValue = count > 0 ? total / count : 0;
          this.kpis.activeBookings = count;
        }
      }
    });

    // Total Matches
    this.dataService.getData(11).subscribe({
      next: (data: any[]) => {
        if (data && data.length > 0) {
          this.kpis.totalMatches = data.reduce((sum, item) => sum + (item.MatchCount || 0), 0);
        }
      }
    });

    // Acceptance Rate
    this.dataService.getData(12).subscribe({
      next: (data: any[]) => {
        if (data && data.length > 0) {
          const accepted = data.find(d => d.status === 'accepted')?.Count || 0;
          const total = data.reduce((sum, item) => sum + (item.Count || 0), 0);
          this.kpis.acceptanceRate = total > 0 ? (accepted / total) * 100 : 0;
        }
      }
    });
  }

  customizeTooltip(arg: any): any {
    return {
      text: `${arg.seriesName}: ${arg.valueText}`
    };
  }

  customizeLabel(arg: any): string {
    return `${arg.valueText}`;
  }

  customizePieLabel(arg: any): string {
    return `${arg.argument}: ${arg.valueText} (${arg.percentText})`;
  }

  pointClick(e: any): void {
    e.target.select();
  }
}
