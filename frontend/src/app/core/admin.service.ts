import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private readonly api: ApiService) {}

  users(token: string): Observable<{ users: Array<Record<string, unknown>> }> {
    return this.api.get('/admin/users', token);
  }

  departmentsStats(token: string): Observable<{ departments: Array<Record<string, unknown>> }> {
    return this.api.get('/admin/departments/stats', token);
  }
}
