import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="container">
      <section class="card">
        <h1>Connexion</h1>
        <form (ngSubmit)="submit()" style="display:grid; gap:.75rem; max-width:420px;">
          <input [(ngModel)]="email" name="email" placeholder="Email" required />
          <input [(ngModel)]="password" name="password" type="password" placeholder="Password" required />
          <button type="submit">Se connecter</button>
        </form>
        <p>{{ message }}</p>
      </section>
    </main>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  message = '';

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  submit(): void {
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.message = 'Connexion réussie';
        this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        this.message = 'Échec de connexion';
      },
    });
  }
}
