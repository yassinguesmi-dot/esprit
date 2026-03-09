import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../core/analytics.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="container">
      <section class="card">
        <h1>Analytics</h1>
        <button (click)="load()">Load Analytics</button>
        <pre>{{ data | json }}</pre>
      </section>
    </main>
  `,
})
export class AnalyticsComponent {
  data: Record<string, unknown> | null = null;

  constructor(private readonly service: AnalyticsService, private readonly auth: AuthService) {}

  load(): void {
    const token = this.auth.getToken();
    if (!token) return;
    this.service.get(token).subscribe((res) => (this.data = res));
  }
}
