import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { WorkOrdersService } from '../../core/services/workorders.service';
import type { WorkOrder } from '../../core/models';

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
          <!-- Notification d'estimations en attente pour les clients -->
          <div class="mechanic-alert mechanic-alert-warning" *ngIf="u.role === 'client' && pendingEstimations().length > 0">
            <h4>🔔 {{ pendingEstimations().length }} estimation(s) en attente de votre approbation !</h4>
            <p>Cliquez sur "Mes Estimations" ci-dessous pour les consulter et les approuver.</p>
          </div>

          <a class="mechanic-card mechanic-btn" *ngIf="u.role === 'client'" routerLink="/client/vehicles">
            <h3>🚗 Mes Véhicules</h3>
            <p>Gérer votre flotte automobile</p>
          </a>
          
          <a class="mechanic-card mechanic-btn" *ngIf="u.role === 'client'" routerLink="/client/appointments">
            <h3>📅 Mes Rendez-vous</h3>
            <p>Planifier vos interventions</p>
          </a>
          
          <a class="mechanic-card mechanic-btn mechanic-btn-success" 
             *ngIf="u.role === 'client'" 
             routerLink="/client/workorders"
             [class.mechanic-btn-pulse]="pendingEstimations().length > 0">
            <h3>🆕 Mes Estimations 
              <span class="badge" *ngIf="pendingEstimations().length > 0">{{ pendingEstimations().length }}</span>
            </h3>
            <p>Suivre vos devis et négocier</p>
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

          <a class="mechanic-card mechanic-btn" *ngIf="u.role === 'mechanic'" routerLink="/mechanic/nearby-clients">
            <h3>🗺️ Clients Proches</h3>
            <p>Géolocalisation et navigation</p>
          </a>

          <a class="mechanic-card mechanic-btn mechanic-btn-info" *ngIf="u.role === 'mechanic'" routerLink="/mechanic/workdays">
            <h3>📅 Mes Jours de Travail</h3>
            <p>Déclarer ma présence</p>
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

          <a class="mechanic-card mechanic-btn" *ngIf="u.role === 'manager'" routerLink="/manager/nearby-clients">
            <h3>🗺️ Clients Proches</h3>
            <p>Géolocalisation et assignation</p>
          </a>

          <a class="mechanic-card mechanic-btn mechanic-btn-info" *ngIf="u.role === 'manager'" routerLink="/manager/workdays">
            <h3>📅 Validation Présence</h3>
            <p>Approuver les jours de travail</p>
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

      .mechanic-btn-pulse {
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(39, 174, 96, 0); }
        100% { box-shadow: 0 0 0 0 rgba(39, 174, 96, 0); }
      }

      .badge {
        background: #e74c3c;
        color: white;
        border-radius: 50%;
        padding: 2px 6px;
        font-size: 12px;
        font-weight: bold;
        margin-left: 8px;
      }

      .mechanic-alert-warning {
        background: linear-gradient(135deg, rgba(243, 156, 18, 0.2), rgba(230, 126, 34, 0.2));
        border: 2px solid #f39c12;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 20px;
        color: #f8f9fa;
      }

      .mechanic-alert-warning h4 {
        color: #f39c12;
        margin: 0 0 8px 0;
      }

      .mechanic-alert-warning p {
        margin: 0;
        color: #f8f9fa;
      }
    `
  ]
})
export class DashboardPageComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private workOrdersService = inject(WorkOrdersService);

  user = computed(() => this.auth.user);
  pendingEstimations = signal<WorkOrder[]>([]);

  async ngOnInit(): Promise<void> {
    await this.auth.init();
    if (!this.auth.user) {
      await this.router.navigate(['/login']);
      return;
    }

    // Charger les estimations en attente pour les clients
    if (this.auth.user.role === 'client') {
      try {
        const workOrders = await this.workOrdersService.list();
        const pending = workOrders.filter(wo => wo.status === 'pending_client_approval');
        this.pendingEstimations.set(pending);
      } catch (error) {
        console.error('Erreur lors du chargement des estimations:', error);
      }
    }
  }
}

