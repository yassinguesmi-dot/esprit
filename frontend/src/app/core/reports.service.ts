import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  constructor(private readonly api: ApiService) {}

  list(token: string): Observable<{ reports: Array<Record<string, unknown>> }> {
    return this.api.get('/reports', token);
  }

  generate(token: string, academicYear: string): Observable<Blob> {
    return this.api.post('/reports/generate', { academic_year: academicYear }, token) as Observable<Blob>;
  }
}
