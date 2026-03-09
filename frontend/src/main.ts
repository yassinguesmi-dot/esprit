import { bootstrapApplication } from '@angular/platform-browser';
import { Component, inject } from '@angular/core';
import { HttpClient, provideHttpClient } from '@angular/common/http';

type HealthResponse = {
  status: string;
  timestamp: string;
};

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <div class="container">
      <div class="card">
        <h1>ESPRIT Activities (Angular)</h1>
        <p>Frontend Angular connecté au backend Spring Boot.</p>
        <button (click)="checkHealth()">Tester API /health</button>
        <p>{{ message }}</p>
      </div>
    </div>
  `,
})
class AppComponent {
  private http = inject(HttpClient);
  message = '';

  checkHealth(): void {
    this.http.get<HealthResponse>('/api/health').subscribe({
      next: (res: HealthResponse) => {
        this.message = `API: ${res.status} (${res.timestamp})`;
      },
      error: () => {
        this.message = 'Erreur de connexion au backend';
      },
    });
  }
}

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient()],
}).catch((err: unknown) => console.error(err));
