import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import type { UserRole } from '../../core/models';

type Preset = { label: string; email: string; password: string; role: UserRole };

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h2>Connexion</h2>

      <label class="field">
        <span>Profil (logins par défaut)</span>
        <select [(ngModel)]="presetKey" (ngModelChange)="applyPreset()">
          <option value="client">Client</option>
          <option value="mechanic">Mécanicien</option>
          <option value="manager">Manager</option>
        </select>
      </label>

      <label class="field">
        <span>Email</span>
        <input [(ngModel)]="email" type="email" autocomplete="username" />
      </label>

      <label class="field">
        <span>Mot de passe</span>
        <input [(ngModel)]="password" type="password" autocomplete="current-password" />
      </label>

      <button (click)="submit()" [disabled]="loading()">Se connecter</button>

      <p class="error" *ngIf="error()">{{ error() }}</p>
    </div>
  `,
  styles: [
    `
      .card {
        max-width: 420px;
        margin: 24px auto;
        padding: 16px;
        border: 1px solid #e3e3e3;
        border-radius: 10px;
        background: #fff;
      }
      .field {
        display: grid;
        gap: 6px;
        margin: 10px 0;
      }
      input,
      select {
        padding: 10px;
        border-radius: 8px;
        border: 1px solid #ccc;
      }
      button {
        margin-top: 12px;
        width: 100%;
        padding: 10px;
        border-radius: 8px;
        border: 0;
        background: #0b57d0;
        color: white;
        cursor: pointer;
      }
      button[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .error {
        margin-top: 10px;
        color: #b00020;
      }
    `
  ]
})
export class LoginPageComponent {
  presets: Record<string, Preset> = {
    client: { label: 'Client', email: 'client@demo.com', password: 'client123', role: 'client' },
    mechanic: { label: 'Mécanicien', email: 'mechanic@demo.com', password: 'mechanic123', role: 'mechanic' },
    manager: { label: 'Manager', email: 'manager@demo.com', password: 'manager123', role: 'manager' }
  };

  presetKey = 'client';
  email = this.presets['client'].email;
  password = this.presets['client'].password;

  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  applyPreset(): void {
    const preset = this.presets[this.presetKey] || this.presets['client'];
    this.email = preset.email;
    this.password = preset.password;
  }

  async submit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.login(this.email, this.password);
      await this.router.navigate(['/dashboard']);
    } catch {
      this.error.set('Identifiants invalides ou API indisponible');
    } finally {
      this.loading.set(false);
    }
  }
}
