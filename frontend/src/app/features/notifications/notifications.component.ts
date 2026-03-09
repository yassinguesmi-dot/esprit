import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsService } from '../../core/notifications.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="container">
      <section class="card">
        <h1>Notifications</h1>
        <button (click)="load()">Load</button>
        <p>Unread: {{ unreadCount }}</p>
        <ul>
          <li *ngFor="let n of notifications">{{ n['title'] || n['type'] }} - {{ n['message'] }}</li>
        </ul>
      </section>
    </main>
  `,
})
export class NotificationsComponent {
  notifications: Array<Record<string, unknown>> = [];
  unreadCount = 0;

  constructor(private readonly service: NotificationsService, private readonly auth: AuthService) {}

  load(): void {
    const token = this.auth.getToken();
    if (!token) return;
    this.service.list(token).subscribe((res) => {
      this.notifications = res.notifications;
      this.unreadCount = res.unread_count;
    });
  }
}
