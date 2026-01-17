import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mechanic-theme">
      <div class="mechanic-wrap">
        <div class="mechanic-banner">
          🚀 Garage Management System v2.0 - Interface Professionnelle 🚀
        </div>
        
        <h2 class="mechanic-title">🏠 Tableau de Bord Central 🏠</h2>
        <p *ngIf="!user()" class="mechanic-alert mechanic-alert-info">Vous devez vous connecter.</p>

        <div class="mechanic-grid" *ngIf="user() as u">
          <a class="mechanic-card mechanic-btn" *ngIf="u.role === 'client'" routerLink="/client/vehicles">
            <h3>🚗 Mes Véhicules</h3>
            <p>Gérer votre flotte automobile</p>
          </a>
          
          <a class="mechanic-card mechanic-btn" *ngIf="u.role === 'client'" routerLink="/client/appointments">
            <h3>📅 Mes Rendez-vous</h3>
            <p>Planifier vos interventions</p>
          </a>
          
          <a class="mechanic-card mechanic-btn mechanic-btn-success" *ngIf="u.role === 'client'" routerLink="/client/workorders">
            <h3>🆕 Mes Estimations</h3>
            <p>Suivre vos devis et factures</p>
          </a>

          <a class="mechanic-card mechanic-btn" *ngIf="u.role === 'client'" routerLink="/client/invoices">
            <h3>📄 Mes Factures</h3>
            <p>Télécharger vos factures</p>
          </a>

          <a class="mechanic-card mechanic-btn mechanic-btn-warning" *ngIf="u.role === 'mechanic'" routerLink="/mechanic/workorders">
            <h3>🆕 Atelier Mécanicien</h3>
            <p>Diagnostic et réparations</p>
          </a>

          <a class="mechanic-card mechanic-btn mechanic-btn-success" *ngIf="u.role === 'mechanic'" routerLink="/mechanic/earnings">
            <h3>💰 Mes Revenus</h3>
            <p>Salaire et commissions</p>
          </a>

          <a class="mechanic-card mechanic-btn" *ngIf="u.role === 'manager'" routerLink="/manager/appointments">
            <h3>📋 Gestion Rendez-vous</h3>
            <p>Planification et assignation</p>
          </a>
          
          <a class="mechanic-card mechanic-btn mechanic-btn-info" *ngIf="u.role === 'manager'" routerLink="/manager/workorders">
            <h3>⚡ Ordres de Réparation</h3>
            <p>Supervision des travaux</p>
          </a>
          
          <a class="mechanic-card mechanic-btn" *ngIf="u.role === 'manager'" routerLink="/manager/vehicles">
            <h3>🚙 Base Véhicules</h3>
            <p>Inventaire complet</p>
          </a>

          <a class="mechanic-card mechanic-btn mechanic-btn-danger" *ngIf="u.role === 'manager'" routerLink="/manager/registrations">
            <h3>📋 Inscriptions en attente</h3>
            <p>Valider les nouveaux utilisateurs</p>
          </a>

          <a class="mechanic-card mechanic-btn" *ngIf="u.role === 'manager'" routerLink="/manager/invoices">
            <h3>📄 Factures</h3>
            <p>Gestion des factures</p>
          </a>

          <a class="mechanic-card mechanic-btn mechanic-btn-warning" *ngIf="u.role === 'manager'" routerLink="/manager/vat-settings">
            <h3>⚙️ Paramètres TVA</h3>
            <p>Configuration des taux</p>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .mechanic-card {
        text-decoration: none;
        color: inherit;
        transition: all 0.3s ease;
        cursor: pointer;
      }
      
      .mechanic-card h3 {
        margin-bottom: 8px;
      }
      
      .mechanic-card p {
        margin: 0;
        font-size: 0.9em;
        opacity: 0.8;
        font-style: italic;
      }
      
      .mechanic-card:hover {
        color: inherit;
        text-decoration: none;
      }
    `
  ]
})
export class DashboardPageComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  user = computed(() => this.auth.user);

  async ngOnInit(): Promise<void> {
    await this.auth.init();
    if (!this.auth.user) {
      await this.router.navigate(['/login']);
    }
  }
}

