import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/admin.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="container">
      <section class="card">
        <h1>Admin</h1>
        <button (click)="loadUsers()">Load Users</button>
        <button (click)="loadDepartments()">Load Departments Stats</button>
        <h3>Users</h3>
        <ul>
          <li *ngFor="let u of users">{{ u['email'] }} - {{ u['role'] }}</li>
        </ul>
        <h3>Departments</h3>
        <ul>
          <li *ngFor="let d of departments">{{ d['name'] }} (staff: {{ d['staff_count'] }})</li>
        </ul>
      </section>
    </main>
  `,
})
export class AdminComponent {
  users: Array<Record<string, unknown>> = [];
  departments: Array<Record<string, unknown>> = [];

  constructor(private readonly admin: AdminService, private readonly auth: AuthService) {}

  loadUsers(): void {
    const token = this.auth.getToken();
    if (!token) return;
    this.admin.users(token).subscribe((res: { users: Array<Record<string, unknown>> }) => (this.users = res.users));
  }

  loadDepartments(): void {
    const token = this.auth.getToken();
    if (!token) return;
    this.admin.departmentsStats(token).subscribe((res: { departments: Array<Record<string, unknown>> }) => (this.departments = res.departments));
  }
}
