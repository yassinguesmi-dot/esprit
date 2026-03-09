import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="container">
      <section class="card">
        <h1>Dashboard</h1>
        <button (click)="loadHealth()">Tester backend</button>
        <pre>{{ health | json }}</pre>
      </section>
    </main>
  `,
})
export class DashboardComponent {
  health: unknown;

  constructor(private readonly api: ApiService, private readonly auth: AuthService) {}

  loadHealth(): void {
    const token = this.auth.getToken() ?? undefined;
    this.api.get<unknown>('/health', token).subscribe({
      next: (res) => (this.health = res),
      error: () => (this.health = { error: 'Backend unreachable' }),
    });
  }
}
