import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-mobile-nav',
  imports: [CommonModule, RouterModule],
  template: `
    <div class="mobile-nav" [class.open]="isOpen()">
      <!-- Hamburger Button -->
      <button 
        class="hamburger-btn" 
        (click)="toggleMenu()"
        [class.active]="isOpen()"
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>

      <!-- Brand -->
      <a routerLink="/dashboard" class="mobile-brand" (click)="closeMenu()">
        🔧 Garage Pro
      </a>

      <!-- User Info -->
      <div class="user-info" *ngIf="user()">
        <span class="user-role">{{ getRoleIcon() }}</span>
      </div>

      <!-- Overlay -->
      <div 
        class="nav-overlay" 
        [class.visible]="isOpen()" 
        (click)="closeMenu()"
      ></div>

      <!-- Slide Menu -->
      <nav class="nav-menu" [class.open]="isOpen()">
        <div class="nav-header">
          <div class="user-profile" *ngIf="user() as u">
            <div class="user-avatar">{{ getInitials(u.fullName) }}</div>
            <div class="user-details">
              <div class="user-name">{{ u.fullName }}</div>
              <div class="user-role-text">{{ getRoleText(u.role) }}</div>
            </div>
          </div>
        </div>

        <div class="nav-links">
          <!-- Dashboard -->
          <a routerLink="/dashboard" class="nav-link" (click)="closeMenu()">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">Tableau de Bord</span>
          </a>

          <!-- Client Links -->
          <ng-container *ngIf="user()?.role === 'client'">
            <a routerLink="/client/vehicles" class="nav-link" (click)="closeMenu()">
              <span class="nav-icon">🚗</span>
              <span class="nav-text">Mes Véhicules</span>
            </a>
            <a routerLink="/client/appointments" class="nav-link" (click)="closeMenu()">
              <span class="nav-icon">📅</span>
              <span class="nav-text">Rendez-vous</span>
            </a>
            <a routerLink="/client/workorders" class="nav-link" (click)="closeMenu()">
              <span class="nav-icon">📋</span>
              <span class="nav-text">Estimations</span>
            </a>
            <a routerLink="/client/invoices" class="nav-link" (click)="closeMenu()">
              <span class="nav-icon">📄</span>
              <span class="nav-text">Factures</span>
            </a>
          </ng-container>

          <!-- Mechanic Links -->
          <ng-container *ngIf="user()?.role === 'mechanic'">
            <a routerLink="/mechanic/workorders" class="nav-link" (click)="closeMenu()">
              <span class="nav-icon">🔧</span>
              <span class="nav-text">Atelier</span>
            </a>
            <a routerLink="/mechanic/earnings" class="nav-link" (click)="closeMenu()">
              <span class="nav-icon">💰</span>
              <span class="nav-text">Revenus</span>
            </a>
            <a routerLink="/mechanic/nearby-clients" class="nav-link" (click)="closeMenu()">
              <span class="nav-icon">🗺️</span>
              <span class="nav-text">Clients Proches</span>
            </a>
          </ng-container>

          <!-- Manager Links -->
          <ng-container *ngIf="user()?.role === 'manager'">
            <a routerLink="/manager/appointments" class="nav-link" (click)="closeMenu()">
              <span class="nav-icon">📋</span>
              <span class="nav-text">Rendez-vous</span>
            </a>
            <a routerLink="/manager/workorders" class="nav-link" (click)="closeMenu()">
              <span class="nav-icon">⚡</span>
              <span class="nav-text">Réparations</span>
            </a>
            <a routerLink="/manager/vehicles" class="nav-link" (click)="closeMenu()">
              <span class="nav-icon">🚙</span>
              <span class="nav-text">Véhicules</span>
            </a>
            <a routerLink="/manager/registrations" class="nav-link" (click)="closeMenu()">
              <span class="nav-icon">👥</span>
              <span class="nav-text">Inscriptions</span>
            </a>
            <a routerLink="/manager/invoices" class="nav-link" (click)="closeMenu()">
              <span class="nav-icon">📄</span>
              <span class="nav-text">Factures</span>
            </a>
            <a routerLink="/manager/vat-settings" class="nav-link" (click)="closeMenu()">
              <span class="nav-icon">⚙️</span>
              <span class="nav-text">TVA</span>
            </a>
            <a routerLink="/manager/nearby-clients" class="nav-link" (click)="closeMenu()">
              <span class="nav-icon">🗺️</span>
              <span class="nav-text">Clients Proches</span>
            </a>
          </ng-container>
        </div>

        <div class="nav-footer">
          <button class="logout-btn" (click)="logout()">
            <span class="nav-icon">🚪</span>
            <span class="nav-text">Déconnexion</span>
          </button>
        </div>
      </nav>
    </div>
  `,
  styles: [`
    .mobile-nav {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      height: 60px;
      padding: 0 16px;
      background: linear-gradient(135deg, #2c3e50, #34495e);
      border-bottom: 2px solid #e67e22;
      z-index: 1000;
    }

    /* Hamburger Button */
    .hamburger-btn {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 40px;
      height: 40px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .hamburger-btn:hover {
      background: rgba(230, 126, 34, 0.2);
    }

    .hamburger-line {
      width: 24px;
      height: 3px;
      background: #f39c12;
      margin: 2px 0;
      transition: all 0.3s ease;
      border-radius: 2px;
    }

    .hamburger-btn.active .hamburger-line:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }

    .hamburger-btn.active .hamburger-line:nth-child(2) {
      opacity: 0;
    }

    .hamburger-btn.active .hamburger-line:nth-child(3) {
      transform: rotate(-45deg) translate(7px, -6px);
    }

    /* Brand */
    .mobile-brand {
      font-weight: 700;
      color: #f39c12;
      text-decoration: none;
      font-size: 1.1em;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    /* User Info */
    .user-info {
      display: flex;
      align-items: center;
    }

    .user-role {
      font-size: 1.2em;
      padding: 8px;
      background: rgba(230, 126, 34, 0.2);
      border-radius: 50%;
      border: 2px solid #e67e22;
    }

    /* Overlay */
    .nav-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      z-index: 1001;
    }

    .nav-overlay.visible {
      opacity: 1;
      visibility: visible;
    }

    /* Slide Menu */
    .nav-menu {
      position: fixed;
      top: 0;
      left: -300px;
      width: 280px;
      height: 100vh;
      background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
      transition: left 0.3s ease;
      z-index: 1002;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .nav-menu.open {
      left: 0;
    }

    /* Nav Header */
    .nav-header {
      padding: 20px 16px;
      border-bottom: 1px solid #34495e;
      background: linear-gradient(135deg, #e67e22, #f39c12);
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 50px;
      height: 50px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.2em;
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .user-details {
      flex: 1;
    }

    .user-name {
      font-weight: 600;
      color: white;
      font-size: 1.1em;
      margin-bottom: 4px;
    }

    .user-role-text {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Nav Links */
    .nav-links {
      flex: 1;
      padding: 16px 0;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      color: #ecf0f1;
      text-decoration: none;
      transition: all 0.3s ease;
      border-left: 4px solid transparent;
    }

    .nav-link:hover {
      background: rgba(230, 126, 34, 0.1);
      border-left-color: #e67e22;
      color: #f39c12;
      text-decoration: none;
    }

    .nav-link.active {
      background: rgba(230, 126, 34, 0.2);
      border-left-color: #f39c12;
      color: #f39c12;
    }

    .nav-icon {
      font-size: 1.2em;
      width: 24px;
      text-align: center;
    }

    .nav-text {
      font-weight: 500;
    }

    /* Nav Footer */
    .nav-footer {
      padding: 16px;
      border-top: 1px solid #34495e;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 16px;
      background: linear-gradient(135deg, #e74c3c, #c0392b);
      border: none;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .logout-btn:hover {
      background: linear-gradient(135deg, #c0392b, #a93226);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
    }

    /* Desktop Hide */
    @media (min-width: 768px) {
      .mobile-nav {
        display: none;
      }
    }
  `]
})
export class MobileNavComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  isOpen = signal(false);
  user = computed(() => this.auth.user);

  toggleMenu(): void {
    this.isOpen.set(!this.isOpen());
  }

  closeMenu(): void {
    this.isOpen.set(false);
  }

  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getRoleIcon(): string {
    const role = this.user()?.role;
    switch (role) {
      case 'client': return '👤';
      case 'mechanic': return '🔧';
      case 'manager': return '👨‍💼';
      default: return '❓';
    }
  }

  getRoleText(role: string): string {
    switch (role) {
      case 'client': return 'Client';
      case 'mechanic': return 'Mécanicien';
      case 'manager': return 'Manager';
      default: return 'Utilisateur';
    }
  }

  async logout(): Promise<void> {
    this.closeMenu();
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}