import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private readonly api: ApiService) {}

  get(token: string): Observable<Record<string, unknown>> {
    return this.api.get('/analytics', token);
  }
}
