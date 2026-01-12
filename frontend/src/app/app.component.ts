import { Component, computed, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe],
  template: `
    <div class="layout page-mechanic-theme">
      <header class="header">
        <a class="brand" routerLink="/dashboard">🔧 Garage Pro System 🔧</a>
        <nav class="nav" *ngIf="user$ | async as user; else guest">
          <a routerLink="/dashboard" routerLinkActive="active">🏠 Dashboard</a>
          <a *ngIf="user.role === 'client'" routerLink="/client/vehicles" routerLinkActive="active">🚗 Véhicules</a>
          <a *ngIf="user.role === 'client'" routerLink="/client/appointments" routerLinkActive="active">📅 Rendez-vous</a>
          <a *ngIf="user.role === 'client'" routerLink="/client/workorders" routerLinkActive="active">💰 Estimations</a>
          <a *ngIf="user.role === 'mechanic'" routerLink="/mechanic/workorders" routerLinkActive="active">🔧 Atelier</a>
          <a *ngIf="user.role === 'manager'" routerLink="/manager/appointments" routerLinkActive="active">📋 Rendez-vous</a>
          <a *ngIf="user.role === 'manager'" routerLink="/manager/workorders" routerLinkActive="active">⚙️ Ordres</a>
          <a *ngIf="user.role === 'manager'" routerLink="/manager/vehicles" routerLinkActive="active">🚙 Véhicules</a>
          <button class="logout" (click)="logout()">🚪 Déconnexion</button>
        </nav>
        <ng-template #guest>
          <nav class="nav">
            <a routerLink="/login" routerLinkActive="active">🔐 Connexion</a>
          </nav>
        </ng-template>
      </header>

      <main class="main">
        <router-outlet />
      </main>

      <footer class="footer">
        <span>🛠️ Garage Management System v2.0</span>
        <span>·</span>
        <span>Interface Professionnelle Mécanicien</span>
      </footer>
    </div>
  `,
  styleUrl: './app.component.css'
})
export class AppComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  user$ = this.auth.user$;
  user = computed(() => this.auth.user);

  async ngOnInit(): Promise<void> {
    await this.auth.init();
    if (!this.user()) {
      await this.router.navigate(['/login']);
    }
  }

  async logout(): Promise<void> {
    this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
