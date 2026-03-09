import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeachingService, TeachingActivity } from '../../core/teaching.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-teaching',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="container">
      <section class="card">
        <h1>Teaching Activities</h1>
        <button (click)="load()">Charger</button>
        <p>Total: {{ total }}</p>
        <ul>
          <li *ngFor="let a of activities">
            {{ a.academic_year }} - S{{ a.semester }} - {{ a.teaching_type }} - {{ a.actual_hours }}h
          </li>
        </ul>
      </section>
    </main>
  `,
})
export class TeachingComponent {
  activities: TeachingActivity[] = [];
  total = 0;

  constructor(private readonly teaching: TeachingService, private readonly auth: AuthService) {}

  load(): void {
    const token = this.auth.getToken();
    if (!token) {
      this.activities = [];
      this.total = 0;
      return;
    }

    this.teaching.list(token).subscribe({
      next: (res) => {
        this.activities = res.activities;
        this.total = res.totals.count;
      },
      error: () => {
        this.activities = [];
        this.total = 0;
      },
    });
  }
}
