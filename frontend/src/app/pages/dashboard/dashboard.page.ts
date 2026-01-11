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
      <h2>Tableau de bord</h2>
      <p *ngIf="!user()">Vous devez vous connecter.</p>

      <div class="grid" *ngIf="user() as u">
        <a class="tile" *ngIf="u.role === 'client'" routerLink="/client/vehicles">Mes véhicules</a>
        <a class="tile" *ngIf="u.role === 'client'" routerLink="/client/appointments">Mes rendez-vous</a>
        <a class="tile" *ngIf="u.role === 'client'" routerLink="/client/workorders">Mes estimations</a>

        <a class="tile" *ngIf="u.role === 'mechanic'" routerLink="/mechanic/workorders">Estimations et réparations</a>

        <a class="tile" *ngIf="u.role === 'manager'" routerLink="/manager/appointments">Rendez-vous</a>
        <a class="tile" *ngIf="u.role === 'manager'" routerLink="/manager/workorders">Ordres de réparation</a>
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
      }
      .tile:hover {
        border-color: #0b57d0;
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

