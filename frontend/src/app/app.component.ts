import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="container">
      <div class="card" style="display:flex; gap:1rem; align-items:center;">
        <strong>ESPRIT Activities</strong>
        <a routerLink="/login">Login</a>
        <a routerLink="/dashboard">Dashboard</a>
        <a routerLink="/teaching">Teaching</a>
        <a routerLink="/reports">Reports</a>
        <a routerLink="/notifications">Notifications</a>
        <a routerLink="/analytics">Analytics</a>
        <a routerLink="/admin">Admin</a>
      </div>
    </header>
    <router-outlet />
  `,
})
export class AppComponent {}
