import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService } from '../../core/reports.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="container">
      <section class="card">
        <h1>Reports</h1>
        <input [(ngModel)]="academicYear" placeholder="2023-2024" />
        <button (click)="load()">Refresh</button>
        <ul>
          <li *ngFor="let r of reports">{{ r['id'] }} - {{ r['academic_year'] }}</li>
        </ul>
      </section>
    </main>
  `,
})
export class ReportsComponent {
  academicYear = '2023-2024';
  reports: Array<Record<string, unknown>> = [];

  constructor(private readonly service: ReportsService, private readonly auth: AuthService) {}

  load(): void {
    const token = this.auth.getToken();
    if (!token) return;
    this.service.list(token).subscribe((res: { reports: Array<Record<string, unknown>> }) => {
      this.reports = res.reports;
    });
  }
}
