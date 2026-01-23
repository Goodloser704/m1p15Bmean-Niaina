import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkdaysService, type WorkDay } from '../../core/services/workdays.service';

@Component({
  standalone: true,
  selector: 'app-manager-workdays-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-manager-theme">
      <div class="wrap">
        <h2>📅 Validation des Jours de Travail</h2>

        <!-- Statistiques -->
        <div class="stats-summary">
          <div class="stat-card pending">
            <div class="icon">⏳</div>
            <div class="content">
              <div class="value">{{ pendingCount() }}</div>
              <div class="label">En attente</div>
            </div>
          </div>
          <div class="stat-card approved">
            <div class="icon">✅</div>
            <div class="content">
              <div class="value">{{ approvedToday() }}</div>
              <div class="label">Approuvés aujourd'hui</div>
            </div>
          </div>
          <div class="stat-card rejected">
            <div class="icon">❌</div>
            <div class="content">
              <div class="value">{{ rejectedToday() }}</div>
              <div class="label">Rejetés aujourd'hui</div>
            </div>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="card quick-actions">
          <h4>⚡ Actions Rapides</h4>
          <div class="actions-grid">
            <button 
              (click)="approveAll()" 
              class="btn btn-success"
              [disabled]="loading() || pendingWorkDays().length === 0"
            >
              ✅ Tout Approuver
            </button>
            <button 
              (click)="showBulkReject = !showBulkReject" 
              class="btn btn-warning"
              [disabled]="pendingWorkDays().length === 0"
            >
              ❌ Rejet en Masse
            </button>
            <button 
              (click)="loadPendingWorkDays()" 
              class="btn btn-secondary"
              [disabled]="loading()"
            >
              🔄 Actualiser
            </button>
          </div>

          <!-- Formulaire de rejet en masse -->
          <div *ngIf="showBulkReject" class="bulk-reject-form">
            <div class="form-group">
              <label>Raison du rejet :</label>
              <textarea 
                [(ngModel)]="bulkRejectReason" 
                class="form-control"
                rows="3"
                placeholder="Expliquez pourquoi ces déclarations sont rejetées..."
              ></textarea>
            </div>
            <div class="form-actions">
              <button 
                (click)="rejectAll()" 
                class="btn btn-danger"
                [disabled]="loading() || !bulkRejectReason.trim()"
              >
                Confirmer le Rejet
              </button>
              <button 
                (click)="showBulkReject = false; bulkRejectReason = ''" 
                class="btn btn-secondary"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>

        <!-- Liste des déclarations en attente -->
        <div class="card">
          <h4>📋 Déclarations en Attente de Validation</h4>
          
          <div *ngIf="pendingWorkDays().length > 0" class="workdays-list">
            <div 
              *ngFor="let workDay of pendingWorkDays()" 
              class="workday-item"
            >
              <div class="workday-header">
                <div class="mechanic-info">
                  <strong>{{ getMechanicName(workDay) }}</strong>
                  <span class="email">{{ getMechanicEmail(workDay) }}</span>
                </div>
                <div class="date-info">
                  <div class="date">{{ formatDate(workDay.date) }}</div>
                  <div class="day-name">{{ getDayName(workDay.date) }}</div>
                </div>
              </div>

              <div class="workday-details">
                <div class="hours-info">
                  <span class="hours">{{ workDay.hoursWorked }}h</span>
                  <span class="declared-time">
                    Déclaré {{ getTimeAgo(workDay.declaredAt) }}
                  </span>
                </div>
                
                <div class="notes" *ngIf="workDay.notes">
                  <strong>Notes :</strong> {{ workDay.notes }}
                </div>
              </div>

              <div class="workday-actions">
                <button 
                  (click)="approveWorkDay(workDay._id)" 
                  class="btn btn-success btn-sm"
                  [disabled]="loading()"
                >
                  ✅ Approuver
                </button>
                <button 
                  (click)="showRejectForm(workDay._id)" 
                  class="btn btn-danger btn-sm"
                  [disabled]="loading()"
                >
                  ❌ Rejeter
                </button>
              </div>

              <!-- Formulaire de rejet individuel -->
              <div *ngIf="rejectingWorkDayId() === workDay._id" class="reject-form">
                <div class="form-group">
                  <label>Raison du rejet :</label>
                  <textarea 
                    [(ngModel)]="rejectReason" 
                    class="form-control"
                    rows="2"
                    placeholder="Expliquez pourquoi cette déclaration est rejetée..."
                  ></textarea>
                </div>
                <div class="form-actions">
                  <button 
                    (click)="confirmReject(workDay._id)" 
                    class="btn btn-danger btn-sm"
                    [disabled]="loading() || !rejectReason.trim()"
                  >
                    Confirmer
                  </button>
                  <button 
                    (click)="cancelReject()" 
                    class="btn btn-secondary btn-sm"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="pendingWorkDays().length === 0 && !loading()" class="empty-state">
            <div class="empty-icon">🎉</div>
            <h3>Aucune déclaration en attente</h3>
            <p>Toutes les déclarations ont été traitées !</p>
          </div>
        </div>

        <!-- Historique récent -->
        <div class="card">
          <h4>📚 Historique Récent</h4>
          
          <div class="history-filters">
            <button 
              (click)="historyFilter.set('today')"
              class="filter-btn"
              [class.active]="historyFilter() === 'today'"
            >
              Aujourd'hui
            </button>
            <button 
              (click)="historyFilter.set('week')"
              class="filter-btn"
              [class.active]="historyFilter() === 'week'"
            >
              Cette semaine
            </button>
            <button 
              (click)="historyFilter.set('month')"
              class="filter-btn"
              [class.active]="historyFilter() === 'month'"
            >
              Ce mois
            </button>
          </div>

          <div class="history-summary">
            <div class="summary-item">
              <span class="count approved">{{ filteredHistory().approved }}</span>
              <span class="label">Approuvés</span>
            </div>
            <div class="summary-item">
              <span class="count rejected">{{ filteredHistory().rejected }}</span>
              <span class="label">Rejetés</span>
            </div>
            <div class="summary-item">
              <span class="count total">{{ filteredHistory().total }}</span>
              <span class="label">Total traité</span>
            </div>
          </div>
        </div>

        <p class="error" *ngIf="error()">{{ error() }}</p>
        <p class="success" *ngIf="success()">{{ success() }}</p>
      </div>
    </div>
  `,
  styles: [`
    .stats-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: linear-gradient(135deg, #2c3e50, #34495e);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      border: 2px solid;
      transition: all 0.3s ease;
    }

    .stat-card.pending {
      border-color: #f39c12;
    }

    .stat-card.approved {
      border-color: #27ae60;
    }

    .stat-card.rejected {
      border-color: #e74c3c;
    }

    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .stat-card .icon {
      font-size: 32px;
    }

    .stat-card .value {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 4px;
    }

    .stat-card .label {
      color: #bdc3c7;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .quick-actions {
      background: linear-gradient(135deg, #34495e, #2c3e50);
    }

    .actions-grid {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }

    .btn {
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 12px;
    }

    .btn-success {
      background: linear-gradient(135deg, #27ae60, #2ecc71);
      color: white;
    }

    .btn-warning {
      background: linear-gradient(135deg, #f39c12, #e67e22);
      color: white;
    }

    .btn-danger {
      background: linear-gradient(135deg, #e74c3c, #c0392b);
      color: white;
    }

    .btn-secondary {
      background: linear-gradient(135deg, #95a5a6, #7f8c8d);
      color: white;
    }

    .btn-sm {
      padding: 8px 16px;
      font-size: 11px;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .bulk-reject-form,
    .reject-form {
      margin-top: 20px;
      padding: 20px;
      background: rgba(231, 76, 60, 0.1);
      border-radius: 8px;
      border: 1px solid rgba(231, 76, 60, 0.3);
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      color: #bdc3c7;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 2px solid #34495e;
      border-radius: 8px;
      background: rgba(52, 73, 94, 0.3);
      color: #ecf0f1;
      font-size: 14px;
      resize: vertical;
    }

    .form-control:focus {
      outline: none;
      border-color: #e67e22;
      box-shadow: 0 0 0 3px rgba(230, 126, 34, 0.2);
    }

    .form-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .workdays-list {
      display: grid;
      gap: 20px;
    }

    .workday-item {
      padding: 20px;
      background: rgba(52, 73, 94, 0.3);
      border-radius: 12px;
      border: 2px solid #34495e;
      transition: all 0.3s ease;
    }

    .workday-item:hover {
      border-color: #e67e22;
      background: rgba(52, 73, 94, 0.5);
    }

    .workday-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .mechanic-info strong {
      color: #ecf0f1;
      font-size: 16px;
      display: block;
      margin-bottom: 4px;
    }

    .mechanic-info .email {
      color: #bdc3c7;
      font-size: 14px;
    }

    .date-info {
      text-align: right;
    }

    .date-info .date {
      color: #e67e22;
      font-weight: 600;
      font-size: 16px;
    }

    .date-info .day-name {
      color: #95a5a6;
      font-size: 12px;
      text-transform: uppercase;
    }

    .workday-details {
      margin-bottom: 16px;
    }

    .hours-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .hours {
      color: #3498db;
      font-weight: 700;
      font-size: 18px;
    }

    .declared-time {
      color: #95a5a6;
      font-size: 12px;
    }

    .notes {
      color: #ecf0f1;
      font-size: 14px;
      padding: 12px;
      background: rgba(52, 73, 94, 0.5);
      border-radius: 6px;
      border-left: 4px solid #3498db;
    }

    .workday-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #95a5a6;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }

    .empty-state h3 {
      color: #ecf0f1;
      margin-bottom: 12px;
    }

    .history-filters {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 8px 16px;
      border: 2px solid #34495e;
      background: rgba(52, 73, 94, 0.3);
      color: #bdc3c7;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .filter-btn.active,
    .filter-btn:hover {
      border-color: #e67e22;
      background: rgba(230, 126, 34, 0.2);
      color: #e67e22;
    }

    .history-summary {
      display: flex;
      justify-content: space-around;
      gap: 20px;
      flex-wrap: wrap;
    }

    .summary-item {
      text-align: center;
    }

    .summary-item .count {
      display: block;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .summary-item .count.approved {
      color: #27ae60;
    }

    .summary-item .count.rejected {
      color: #e74c3c;
    }

    .summary-item .count.total {
      color: #3498db;
    }

    .summary-item .label {
      color: #bdc3c7;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .success {
      color: #27ae60;
      background: rgba(39, 174, 96, 0.1);
      padding: 12px;
      border-radius: 8px;
      border-left: 4px solid #27ae60;
    }

    .error {
      color: #e74c3c;
      background: rgba(231, 76, 60, 0.1);
      padding: 12px;
      border-radius: 8px;
      border-left: 4px solid #e74c3c;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .workday-header {
        flex-direction: column;
        gap: 12px;
      }
      
      .date-info {
        text-align: left;
      }
      
      .hours-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      
      .actions-grid {
        flex-direction: column;
      }
    }
  `]
})
export class ManagerWorkdaysPageComponent {
  pendingWorkDays = signal<WorkDay[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // État des formulaires
  showBulkReject = false;
  bulkRejectReason = '';
  rejectingWorkDayId = signal<string | null>(null);
  rejectReason = '';

  // Filtres et historique
  historyFilter = signal<'today' | 'week' | 'month'>('today');

  constructor(private workdaysService: WorkdaysService) {}

  async ngOnInit(): Promise<void> {
    await this.loadPendingWorkDays();
  }

  // Computed properties
  pendingCount = computed(() => this.pendingWorkDays().length);

  approvedToday = computed(() => {
    // Pour l'instant, on simule - dans une vraie app, on chargerait les données
    return 0;
  });

  rejectedToday = computed(() => {
    // Pour l'instant, on simule - dans une vraie app, on chargerait les données
    return 0;
  });

  filteredHistory = computed(() => {
    // Pour l'instant, on simule - dans une vraie app, on chargerait les données
    return {
      approved: 0,
      rejected: 0,
      total: 0
    };
  });

  // Chargement des données
  async loadPendingWorkDays(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);
      
      const workDays = await this.workdaysService.getPendingWorkDays();
      this.pendingWorkDays.set(workDays);
      
    } catch (error: any) {
      this.error.set('Erreur lors du chargement des déclarations en attente');
      console.error('Error loading pending work days:', error);
    } finally {
      this.loading.set(false);
    }
  }

  // Actions individuelles
  async approveWorkDay(workDayId: string): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);
      this.success.set(null);

      const result = await this.workdaysService.approveWorkDay(workDayId, 'approve');
      this.success.set(result.message);
      
      // Retirer de la liste des en attente
      this.pendingWorkDays.update(workDays => 
        workDays.filter(wd => wd._id !== workDayId)
      );

    } catch (error: any) {
      this.error.set(error.error?.message || 'Erreur lors de l\'approbation');
    } finally {
      this.loading.set(false);
    }
  }

  showRejectForm(workDayId: string): void {
    this.rejectingWorkDayId.set(workDayId);
    this.rejectReason = '';
  }

  cancelReject(): void {
    this.rejectingWorkDayId.set(null);
    this.rejectReason = '';
  }

  async confirmReject(workDayId: string): Promise<void> {
    if (!this.rejectReason.trim()) {
      this.error.set('Veuillez spécifier une raison pour le rejet');
      return;
    }

    try {
      this.loading.set(true);
      this.error.set(null);
      this.success.set(null);

      const result = await this.workdaysService.approveWorkDay(
        workDayId, 
        'reject', 
        this.rejectReason
      );
      
      this.success.set(result.message);
      
      // Retirer de la liste des en attente
      this.pendingWorkDays.update(workDays => 
        workDays.filter(wd => wd._id !== workDayId)
      );
      
      this.cancelReject();

    } catch (error: any) {
      this.error.set(error.error?.message || 'Erreur lors du rejet');
    } finally {
      this.loading.set(false);
    }
  }

  // Actions en masse
  async approveAll(): Promise<void> {
    const workDayIds = this.pendingWorkDays().map(wd => wd._id);
    
    if (workDayIds.length === 0) return;

    try {
      this.loading.set(true);
      this.error.set(null);
      this.success.set(null);

      let successCount = 0;
      let errorCount = 0;

      for (const workDayId of workDayIds) {
        try {
          await this.workdaysService.approveWorkDay(workDayId, 'approve');
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        this.success.set(`${successCount} déclaration(s) approuvée(s)`);
      }
      
      if (errorCount > 0) {
        this.error.set(`${errorCount} erreur(s) lors de l'approbation`);
      }

      await this.loadPendingWorkDays();

    } catch (error: any) {
      this.error.set('Erreur lors de l\'approbation en masse');
    } finally {
      this.loading.set(false);
    }
  }

  async rejectAll(): Promise<void> {
    if (!this.bulkRejectReason.trim()) {
      this.error.set('Veuillez spécifier une raison pour le rejet');
      return;
    }

    const workDayIds = this.pendingWorkDays().map(wd => wd._id);
    
    if (workDayIds.length === 0) return;

    try {
      this.loading.set(true);
      this.error.set(null);
      this.success.set(null);

      let successCount = 0;
      let errorCount = 0;

      for (const workDayId of workDayIds) {
        try {
          await this.workdaysService.approveWorkDay(workDayId, 'reject', this.bulkRejectReason);
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        this.success.set(`${successCount} déclaration(s) rejetée(s)`);
      }
      
      if (errorCount > 0) {
        this.error.set(`${errorCount} erreur(s) lors du rejet`);
      }

      this.showBulkReject = false;
      this.bulkRejectReason = '';
      await this.loadPendingWorkDays();

    } catch (error: any) {
      this.error.set('Erreur lors du rejet en masse');
    } finally {
      this.loading.set(false);
    }
  }

  // Utilitaires
  getMechanicName(workDay: WorkDay): string {
    return (workDay as any).mechanicId?.fullName || 'Mécanicien inconnu';
  }

  getMechanicEmail(workDay: WorkDay): string {
    return (workDay as any).mechanicId?.email || '';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  getDayName(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long' });
  }

  getTimeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'à l\'instant';
    }
  }
}