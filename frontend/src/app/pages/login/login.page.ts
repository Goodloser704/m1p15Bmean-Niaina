import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import type { UserRole } from '../../core/models';

type Preset = { label: string; email: string; password: string; role: UserRole };

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="mechanic-theme">
      <div class="mechanic-wrap">
        <div class="mechanic-banner">
          🎉 Garage Management System v2.0 - Connexion Sécurisée 🎉
        </div>
        
        <div class="mechanic-card login-card">
          <h2 class="mechanic-title">🔐 Accès Professionnel</h2>

          <div class="update-info mechanic-alert mechanic-alert-success">
            <h4>🆕 Nouveautés de cette version :</h4>
            <ul>
              <li><strong>Mécanicien :</strong> Interface d'estimation complète</li>
              <li><strong>Manager :</strong> Révision et négociation des prix</li>
              <li><strong>Client :</strong> Approbation des estimations</li>
            </ul>
          </div>

          <label class="field">
            <span>Profil (logins par défaut)</span>
            <select [(ngModel)]="presetKey" (ngModelChange)="applyPreset()" class="mechanic-select">
              <option value="client">👤 Client</option>
              <option value="mechanic">🔧 Mécanicien (Nouvelle interface)</option>
              <option value="manager">👔 Manager (Interface mise à jour)</option>
            </select>
          </label>

          <label class="field">
            <span>Email</span>
            <input [(ngModel)]="email" type="email" autocomplete="username" class="mechanic-input" />
          </label>

          <label class="field">
            <span>Mot de passe</span>
            <input [(ngModel)]="password" type="password" autocomplete="current-password" class="mechanic-input" />
          </label>

          <button (click)="submit()" [disabled]="loading()" class="mechanic-btn login-btn">
            <span *ngIf="!loading()">🚀 Se connecter</span>
            <span *ngIf="loading()">⏳ Connexion...</span>
          </button>

          <div class="register-link">
            Pas encore de compte ? <a routerLink="/register">S'inscrire</a>
          </div>

          <p class="mechanic-alert mechanic-alert-error" *ngIf="error()">{{ error() }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Styles spécifiques à la page mécanicien - optimisés */
      .login-card {
        max-width: 500px;
        margin: 0 auto;
      }
      
      .update-info {
        margin-bottom: 20px;
      }
      
      .update-info h4 {
        margin: 0 0 12px 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .update-info ul {
        margin: 0;
        padding-left: 20px;
      }
      
      .update-info li {
        margin: 6px 0;
        font-size: 14px;
      }
      
      .field {
        display: grid;
        gap: 8px;
        margin: 16px 0;
      }
      
      .field span {
        font-weight: 600;
        color: var(--mechanic-light);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-size: 13px;
      }
      
      .login-btn {
        margin-top: 20px;
        width: 100%;
        padding: 14px;
        font-size: 16px;
        font-weight: 700;
      }
      
      .login-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        animation: pulse 1.5s ease-in-out infinite;
      }

      .register-link {
        text-align: center;
        margin-top: 20px;
        color: #f8f9fa;
        font-size: 14px;
      }

      .register-link a {
        color: #e67e22;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s ease;
      }

      .register-link a:hover {
        text-decoration: underline;
        color: #f39c12;
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
