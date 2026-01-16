import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-register-page',
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-mechanic-theme">
      <div class="wrap">
        <div class="register-container">
          <div class="register-card">
            <h2>🔧 Inscription - Garage Automobile</h2>
            
            <form (submit)="onSubmit($event)">
              <div class="form-group">
                <label>Nom complet *</label>
                <input 
                  type="text" 
                  [(ngModel)]="fullName" 
                  name="fullName"
                  placeholder="Jean Dupont"
                  required
                />
              </div>

              <div class="form-group">
                <label>Email *</label>
                <input 
                  type="email" 
                  [(ngModel)]="email" 
                  name="email"
                  placeholder="jean.dupont@example.com"
                  required
                />
              </div>

              <div class="form-group">
                <label>Mot de passe *</label>
                <input 
                  type="password" 
                  [(ngModel)]="password" 
                  name="password"
                  placeholder="••••••••"
                  required
                  minlength="6"
                />
              </div>

              <div class="form-group">
                <label>Confirmer le mot de passe *</label>
                <input 
                  type="password" 
                  [(ngModel)]="confirmPassword" 
                  name="confirmPassword"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div class="form-group">
                <label>Type de compte *</label>
                <select [(ngModel)]="role" name="role" required>
                  <option value="client">Client</option>
                  <option value="mechanic">Mécanicien</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div class="form-group">
                <label>Téléphone</label>
                <input 
                  type="tel" 
                  [(ngModel)]="phone" 
                  name="phone"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div class="form-group">
                <label>Adresse</label>
                <textarea 
                  [(ngModel)]="address" 
                  name="address"
                  placeholder="123 Rue de la République, 75001 Paris"
                  rows="2"
                ></textarea>
              </div>

              <div class="info-box" *ngIf="role === 'mechanic' || role === 'manager'">
                ⚠️ Les inscriptions de mécaniciens et managers nécessitent une validation par un manager existant.
                <span *ngIf="role === 'mechanic'"><br>Le manager configurera votre contrat et salaire lors de l'approbation.</span>
              </div>

              <button 
                type="submit" 
                [disabled]="processing()"
                class="submit-btn"
              >
                S'inscrire
              </button>
            </form>

            <div class="login-link">
              Déjà inscrit ? <a routerLink="/login">Se connecter</a>
            </div>

            <p class="error" *ngIf="error()">{{ error() }}</p>
            <p class="success" *ngIf="success()">{{ success() }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    .register-card {
      background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
      padding: 40px;
      border-radius: 16px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      border: 2px solid #e67e22;
    }

    h2 {
      color: #ffffff;
      text-align: center;
      margin-bottom: 30px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      color: #f8f9fa;
      margin-bottom: 8px;
      font-weight: 600;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
    }

    input, select, textarea {
      width: 100%;
      padding: 12px;
      border: 2px solid #34495e;
      border-radius: 8px;
      background: rgba(44, 62, 80, 0.9);
      color: #ffffff;
      font-family: inherit;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    input::placeholder, textarea::placeholder {
      color: #bdc3c7;
      opacity: 0.8;
    }

    input:focus, select:focus, textarea:focus {
      border-color: #e67e22;
      background: rgba(44, 62, 80, 1);
      box-shadow: 0 0 10px rgba(230, 126, 34, 0.3);
      outline: none;
    }

    .info-box {
      background: rgba(243, 156, 18, 0.2);
      border: 2px solid #f39c12;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 20px;
      color: #f39c12;
      font-size: 14px;
      text-align: center;
    }

    .submit-btn {
      width: 100%;
      padding: 14px;
      border: 2px solid #e67e22;
      border-radius: 8px;
      background: linear-gradient(135deg, #e67e22, #f39c12);
      color: white;
      font-size: 16px;
      font-weight: 600;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(230, 126, 34, 0.4);
    }

    .submit-btn:disabled {
      background: #7f8c8d;
      border-color: #95a5a6;
      cursor: not-allowed;
      transform: none;
    }

    .login-link {
      text-align: center;
      margin-top: 20px;
      color: #f8f9fa;
    }

    .login-link a {
      color: #e67e22;
      text-decoration: none;
      font-weight: 600;
    }

    .login-link a:hover {
      text-decoration: underline;
    }

    .error {
      margin-top: 15px;
      background: rgba(231, 76, 60, 0.1);
      border: 1px solid #e74c3c;
      color: #e74c3c;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
    }

    .success {
      margin-top: 15px;
      background: rgba(39, 174, 96, 0.1);
      border: 1px solid #27ae60;
      color: #27ae60;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
    }
  `]
})
export class RegisterPageComponent {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  role = 'client';
  phone = '';
  address = '';
  
  processing = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    this.error.set(null);
    this.success.set(null);

    // Validation
    if (!this.fullName || !this.email || !this.password || !this.role) {
      this.error.set('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('Les mots de passe ne correspondent pas');
      return;
    }

    if (this.password.length < 6) {
      this.error.set('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    this.processing.set(true);

    try {
      const registerData: any = {
        fullName: this.fullName,
        email: this.email,
        password: this.password,
        role: this.role,
        phone: this.phone || undefined,
        address: this.address || undefined
      };

      const result = await this.authService.register(registerData);

      if (this.role === 'client') {
        // Client : connexion automatique et redirection
        this.success.set('Inscription réussie ! Redirection...');
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      } else {
        // Mécanicien/Manager : en attente de validation
        this.success.set(result.message);
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      }
    } catch (error: any) {
      this.error.set(error.error?.message || 'Erreur lors de l\'inscription');
    } finally {
      this.processing.set(false);
    }
  }
}
