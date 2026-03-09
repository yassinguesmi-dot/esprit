import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  constructor(private readonly api: ApiService) {}

  list(token: string): Observable<{ notifications: Array<Record<string, unknown>>; unread_count: number }> {
    return this.api.get('/notifications', token);
  }

  markRead(token: string, notificationId: string): Observable<Record<string, unknown>> {
    return this.api.put('/notifications', { notificationId, read: true }, token);
  }
}
