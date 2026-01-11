import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="wrap">
      <div class="version-banner">
        🚀 Version 2.0 - Nouveau Workflow d'Estimation Déployé !
      </div>
      
      <h2>Tableau de bord</h2>
      <p *ngIf="!user()">Vous devez vous connecter.</p>

      <div class="grid" *ngIf="user() as u">
        <a class="tile" *ngIf="u.role === 'client'" routerLink="/client/vehicles">Mes véhicules</a>
        <a class="tile" *ngIf="u.role === 'client'" routerLink="/client/appointments">Mes rendez-vous</a>
        <a class="tile new-feature" *ngIf="u.role === 'client'" routerLink="/client/workorders">
          🆕 Mes estimations
        </a>

        <a class="tile new-feature" *ngIf="u.role === 'mechanic'" routerLink="/mechanic/workorders">
          🆕 Estimations et réparations
        </a>

        <a class="tile" *ngIf="u.role === 'manager'" routerLink="/manager/appointments">Rendez-vous</a>
        <a class="tile updated-feature" *ngIf="u.role === 'manager'" routerLink="/manager/workorders">
          ⚡ Ordres de réparation (Mis à jour)
        </a>
        <a class="tile" *ngIf="u.role === 'manager'" routerLink="/manager/vehicles">Véhicules</a>
      </div>
    </div>
  `,
  styles: [
    `
      .wrap {
        max-width: 980px;
        margin: 16px auto;
        padding: 0 12px;
      }
      .version-banner {
        background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
        color: white;
        padding: 16px;
        border-radius: 10px;
        text-align: center;
        font-weight: 600;
        font-size: 18px;
        margin-bottom: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
        margin-top: 12px;
      }
      .tile {
        display: block;
        padding: 14px;
        border: 1px solid #e3e3e3;
        border-radius: 10px;
        background: #fff;
        text-decoration: none;
        color: inherit;
        transition: all 0.3s ease;
      }
      .tile:hover {
        border-color: #0b57d0;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .new-feature {
        background: linear-gradient(135deg, #4caf50, #45a049);
        color: white;
        border: none;
        font-weight: 600;
      }
      .new-feature:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 16px rgba(76, 175, 80, 0.3);
      }
      .updated-feature {
        background: linear-gradient(135deg, #2196f3, #1976d2);
        color: white;
        border: none;
        font-weight: 600;
      }
      .updated-feature:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 16px rgba(33, 150, 243, 0.3);
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

