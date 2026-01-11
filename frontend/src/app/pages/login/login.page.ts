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
    <div class="version-notice">
      🎉 Nouvelle Version 2.0 - Workflow d'Estimation Complet !
    </div>
    
    <div class="card">
      <h2>Connexion</h2>

      <div class="update-info">
        <h4>🆕 Nouveautés de cette version :</h4>
        <ul>
          <li><strong>Mécanicien :</strong> Interface d'estimation complète</li>
          <li><strong>Manager :</strong> Révision et négociation des prix</li>
          <li><strong>Client :</strong> Approbation des estimations</li>
        </ul>
      </div>

      <label class="field">
        <span>Profil (logins par défaut)</span>
        <select [(ngModel)]="presetKey" (ngModelChange)="applyPreset()">
          <option value="client">Client</option>
          <option value="mechanic">🆕 Mécanicien (Nouvelle interface)</option>
          <option value="manager">⚡ Manager (Interface mise à jour)</option>
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
      .version-notice {
        background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
        color: white;
        padding: 16px;
        border-radius: 10px;
        text-align: center;
        font-weight: 600;
        font-size: 16px;
        margin: 20px auto;
        max-width: 420px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      .card {
        max-width: 420px;
        margin: 24px auto;
        padding: 16px;
        border: 1px solid #e3e3e3;
        border-radius: 10px;
        background: #fff;
      }
      .update-info {
        background: #e8f5e8;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 16px;
        border-left: 4px solid #4caf50;
      }
      .update-info h4 {
        margin: 0 0 8px 0;
        color: #2e7d32;
      }
      .update-info ul {
        margin: 0;
        padding-left: 20px;
      }
      .update-info li {
        margin: 4px 0;
        font-size: 14px;
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
