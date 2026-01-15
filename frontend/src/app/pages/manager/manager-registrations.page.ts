import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistrationsService } from '../../core/services/registrations.service';
import type { User } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-manager-registrations-page',
  imports: [CommonModule],
  template: `
    <div class="page-mechanic-theme">
      <div class="wrap">
        <h2>📋 Inscriptions en attente de validation</h2>

        <div class="card">
          <div class="stats">
            <div class="stat-item">
              <span class="stat-number">{{ pendingUsers().length }}</span>
              <span class="stat-label">Inscriptions en attente</span>
            </div>
          </div>
        </div>

        <div class="card" *ngIf="pendingUsers().length > 0">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Téléphone</th>
                <th>Date d'inscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of pendingUsers()">
                <td>{{ user.fullName }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="role-badge" [class]="'role-' + user.role">
                    {{ getRoleLabel(user.role) }}
                  </span>
                </td>
                <td>{{ user.phone || '-' }}</td>
                <td>{{ user.createdAt ? (user.createdAt | date:'short') : '-' }}</td>
                <td>
                  <div class="action-buttons">
                    <button 
                      (click)="approveUser(user.id)" 
                      [disabled]="processing()"
                      class="approve-btn"
                    >
                      ✓ Approuver
                    </button>
                    <button 
                      (click)="rejectUser(user.id)" 
                      [disabled]="processing()"
                      class="reject-btn"
                    >
                      ✗ Refuser
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card" *ngIf="pendingUsers().length === 0">
          <p class="info">Aucune inscription en attente de validation.</p>
        </div>

        <p class="error" *ngIf="error()">{{ error() }}</p>
        <p class="success" *ngIf="success()">{{ success() }}</p>
      </div>
    </div>
  `,
  styles: [`
    .stats {
      display: flex;
      gap: 20px;
      justify-content: center;
      padding: 20px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      background: rgba(230, 126, 34, 0.1);
      border-radius: 12px;
      border: 2px solid #e67e22;
      min-width: 200px;
    }

    .stat-number {
      font-size: 48px;
      font-weight: 700;
      color: #e67e22;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    }

    .stat-label {
      font-size: 14px;
      color: #f8f9fa;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 8px;
    }

    .role-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .role-mechanic {
      background: linear-gradient(135deg, #27ae60, #2ecc71);
      color: white;
    }

    .role-manager {
      background: linear-gradient(135deg, #3498db, #2980b9);
      color: white;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .approve-btn {
      background: linear-gradient(135deg, #27ae60, #2ecc71);
      border: 2px solid #27ae60;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .approve-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(39, 174, 96, 0.4);
    }

    .reject-btn {
      background: linear-gradient(135deg, #e74c3c, #c0392b);
      border: 2px solid #e74c3c;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .reject-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
    }

    button:disabled {
      background: #7f8c8d;
      border-color: #95a5a6;
      cursor: not-allowed;
      transform: none;
    }
  `]
})
export class ManagerRegistrationsPageComponent {
  pendingUsers = signal<User[]>([]);
  processing = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  constructor(private registrationsService: RegistrationsService) {}

  async ngOnInit(): Promise<void> {
    await this.loadPendingUsers();
  }

  async loadPendingUsers(): Promise<void> {
    try {
      const users = await this.registrationsService.getPendingRegistrations();
      this.pendingUsers.set(users);
    } catch (error: any) {
      this.error.set('Erreur lors du chargement des inscriptions');
    }
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'mechanic': 'Mécanicien',
      'manager': 'Manager',
      'client': 'Client'
    };
    return labels[role] || role;
  }

  async approveUser(userId: string): Promise<void> {
    this.processing.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      await this.registrationsService.updateStatus(userId, 'approved');
      this.success.set('Inscription approuvée avec succès !');
      await this.loadPendingUsers();
    } catch (error: any) {
      this.error.set(error.error?.message || 'Erreur lors de l\'approbation');
    } finally {
      this.processing.set(false);
    }
  }

  async rejectUser(userId: string): Promise<void> {
    if (!confirm('Êtes-vous sûr de vouloir refuser cette inscription ?')) {
      return;
    }

    this.processing.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      await this.registrationsService.updateStatus(userId, 'rejected');
      this.success.set('Inscription refusée');
      await this.loadPendingUsers();
    } catch (error: any) {
      this.error.set(error.error?.message || 'Erreur lors du refus');
    } finally {
      this.processing.set(false);
    }
  }
}
