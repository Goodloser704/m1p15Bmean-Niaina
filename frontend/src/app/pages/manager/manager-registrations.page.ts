import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegistrationsService } from '../../core/services/registrations.service';
import type { User } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-manager-registrations-page',
  imports: [CommonModule, FormsModule],
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
                      (click)="user.role === 'mechanic' ? openContractModal(user) : approveUser(user.id)" 
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

        <!-- Modal de configuration du contrat -->
        <div class="modal" *ngIf="showContractModal()" (click)="closeContractModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h3>📋 Configuration du Contrat</h3>
            
            <div *ngIf="selectedUser()">
              <p class="user-info">
                <strong>Mécanicien :</strong> {{ selectedUser()!.fullName }}<br>
                <strong>Email :</strong> {{ selectedUser()!.email }}
              </p>

              <div class="form-group">
                <label>Type de contrat *</label>
                <select [(ngModel)]="contractType" class="mechanic-select">
                  <option value="">-- Sélectionner --</option>
                  <option value="monthly">Mensuel (Salaire fixe par mois)</option>
                  <option value="daily">Journalier (Salaire fixe par jour)</option>
                  <option value="commission">Commission (% sur réparations)</option>
                </select>
              </div>

              <div class="form-group" *ngIf="contractType && contractType !== 'commission'">
                <label>Salaire de base * (€)</label>
                <input 
                  type="number" 
                  [(ngModel)]="baseSalary" 
                  [placeholder]="contractType === 'monthly' ? '2000' : '80'"
                  min="0"
                  step="0.01"
                  class="mechanic-input"
                />
                <small class="hint">
                  {{ contractType === 'monthly' ? 'Salaire mensuel brut' : 'Salaire journalier brut' }}
                </small>
              </div>

              <div class="form-group" *ngIf="contractType">
                <label>Taux de commission (%) {{ contractType === 'commission' ? '*' : '(optionnel)' }}</label>
                <input 
                  type="number" 
                  [(ngModel)]="commissionRate" 
                  placeholder="10"
                  min="0"
                  max="100"
                  step="0.1"
                  class="mechanic-input"
                />
                <small class="hint">
                  Pourcentage du montant total des réparations
                </small>
              </div>

              <div class="bank-section">
                <h4>🏦 Coordonnées Bancaires (optionnel)</h4>
                
                <div class="form-group">
                  <label>IBAN</label>
                  <input 
                    type="text" 
                    [(ngModel)]="iban" 
                    placeholder="FR76 1234 5678 9012 3456 7890 123"
                    class="mechanic-input"
                  />
                </div>

                <div class="form-group">
                  <label>BIC/SWIFT</label>
                  <input 
                    type="text" 
                    [(ngModel)]="bic" 
                    placeholder="BNPAFRPP"
                    class="mechanic-input"
                  />
                </div>

                <div class="form-group">
                  <label>Nom de la banque</label>
                  <input 
                    type="text" 
                    [(ngModel)]="bankName" 
                    placeholder="BNP Paribas"
                    class="mechanic-input"
                  />
                </div>
              </div>

              <div class="modal-actions">
                <button 
                  (click)="approveWithContract()" 
                  [disabled]="processing()"
                  class="mechanic-btn mechanic-btn-success"
                >
                  ✓ Approuver avec ce contrat
                </button>
                <button 
                  (click)="closeContractModal()" 
                  [disabled]="processing()"
                  class="mechanic-btn"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
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

    .contract-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .contract-monthly {
      background: linear-gradient(135deg, #9b59b6, #8e44ad);
      color: white;
    }

    .contract-daily {
      background: linear-gradient(135deg, #e67e22, #d35400);
      color: white;
    }

    .contract-commission {
      background: linear-gradient(135deg, #16a085, #1abc9c);
      color: white;
    }

    .salary-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .salary-info div {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }

    .salary-info strong {
      color: #e67e22;
      font-size: 14px;
    }

    .salary-info small {
      color: #bdc3c7;
      font-size: 11px;
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

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(5px);
    }

    .modal-content {
      background: linear-gradient(135deg, #2c3e50, #34495e);
      padding: 30px;
      border-radius: 16px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      border: 2px solid #e67e22;
    }

    .modal-content h3 {
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 20px;
      text-align: center;
    }

    .user-info {
      background: rgba(52, 73, 94, 0.5);
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      color: #f8f9fa;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      color: #f8f9fa;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .bank-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #34495e;
    }

    .bank-section h4 {
      color: #f8f9fa;
      margin-top: 0;
      margin-bottom: 15px;
    }

    small.hint {
      display: block;
      color: #bdc3c7;
      font-size: 12px;
      margin-top: 4px;
      font-style: italic;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      flex-wrap: wrap;
    }
  `]
})
export class ManagerRegistrationsPageComponent {
  pendingUsers = signal<User[]>([]);
  processing = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  showContractModal = signal(false);
  selectedUser = signal<User | null>(null);

  // Données du contrat
  contractType = '';
  baseSalary: number | null = null;
  commissionRate: number | null = null;
  iban = '';
  bic = '';
  bankName = '';

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

  getContractLabel(contractType?: string): string {
    if (!contractType) return '-';
    const labels: Record<string, string> = {
      'monthly': 'Mensuel',
      'daily': 'Journalier',
      'commission': 'Commission'
    };
    return labels[contractType] || contractType;
  }

  openContractModal(user: User): void {
    this.selectedUser.set(user);
    this.contractType = '';
    this.baseSalary = null;
    this.commissionRate = null;
    this.iban = '';
    this.bic = '';
    this.bankName = '';
    this.showContractModal.set(true);
  }

  closeContractModal(): void {
    this.showContractModal.set(false);
    this.selectedUser.set(null);
  }

  async approveWithContract(): Promise<void> {
    const user = this.selectedUser();
    if (!user) return;

    // Validation
    if (!this.contractType) {
      this.error.set('Veuillez sélectionner un type de contrat');
      return;
    }

    if (this.contractType !== 'commission' && (!this.baseSalary || this.baseSalary <= 0)) {
      this.error.set('Veuillez indiquer un salaire de base valide');
      return;
    }

    if (this.contractType === 'commission' && (!this.commissionRate || this.commissionRate <= 0)) {
      this.error.set('Veuillez indiquer un taux de commission valide');
      return;
    }

    this.processing.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      const contractData: any = {
        contractType: this.contractType,
        baseSalary: this.baseSalary || 0,
        commissionRate: this.commissionRate || 0
      };

      if (this.iban || this.bic || this.bankName) {
        contractData.bankDetails = {
          iban: this.iban || undefined,
          bic: this.bic || undefined,
          bankName: this.bankName || undefined
        };
      }

      await this.registrationsService.updateStatus(user.id, 'approved', contractData);
      this.success.set('Mécanicien approuvé avec succès ! Contrat configuré.');
      this.closeContractModal();
      await this.loadPendingUsers();
    } catch (error: any) {
      this.error.set(error.error?.message || 'Erreur lors de l\'approbation');
    } finally {
      this.processing.set(false);
    }
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
