import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = '/api';

  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, token?: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { headers: this.buildHeaders(token) });
  }

  post<T>(path: string, body: unknown, token?: string): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body, { headers: this.buildHeaders(token) });
  }

  put<T>(path: string, body: unknown, token?: string): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body, { headers: this.buildHeaders(token) });
  }

  delete<T>(path: string, token?: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`, { headers: this.buildHeaders(token) });
  }

  private buildHeaders(token?: string): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
}
