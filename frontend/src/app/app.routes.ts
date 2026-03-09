import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { TeachingComponent } from './features/teaching/teaching.component';
import { ReportsComponent } from './features/reports/reports.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { AnalyticsComponent } from './features/analytics/analytics.component';
import { AdminComponent } from './features/admin/admin.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'teaching', component: TeachingComponent },
  { path: 'reports', component: ReportsComponent },
  { path: 'notifications', component: NotificationsComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: 'login' },
];
