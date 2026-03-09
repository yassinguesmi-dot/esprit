import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface TeachingActivity {
  id: string;
  academic_year: string;
  semester: number;
  teaching_type: string;
  planned_hours: number;
  actual_hours: number;
  status: string;
}

export interface TeachingResponse {
  activities: TeachingActivity[];
  totals: {
    planned_hours: number;
    actual_hours: number;
    count: number;
  };
}

@Injectable({ providedIn: 'root' })
export class TeachingService {
  constructor(private readonly api: ApiService) {}

  list(token: string): Observable<TeachingResponse> {
    return this.api.get<TeachingResponse>('/teaching', token);
  }
}
