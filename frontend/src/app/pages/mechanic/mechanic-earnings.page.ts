import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkOrdersService } from '../../core/services/workorders.service';
import { AppointmentsService } from '../../core/services/appointments.service';
import { AuthService } from '../../core/auth/auth.service';
import type { WorkOrder, Appointment } from '../../core/models';

interface EarningDetail {
  workOrder: WorkOrder;
  appointment: Appointment;
  clientName: string;
  repairDate: string;
  totalPaid: number;
  commission: number;
  commissionRate: number;
}

@Component({
  standalone: true,
  selector: 'app-mechanic-earnings-page',
  imports: [CommonModule],
  template: `
    <div class="page-mechanic-theme">
      <div class="wrap">
        <h2>💰 Mes Revenus</h2>

        <!-- Carte de résumé -->
        <div class="earnings-summary">
          <div class="summary-card total">
            <div class="icon">💵</div>
            <div class="content">
              <div class="label">Total Gagné</div>
              <div class="amount">{{ totalEarnings() }}€</div>
              <div class="subtitle">Depuis votre inscription</div>
            </div>
          </div>

          <div class="summary-card salary">
            <div class="icon">📅</div>
            <div class="content">
              <div class="label">Salaire Mensuel</div>
              <div class="amount">{{ baseSalary() }}€</div>
              <div class="subtitle">{{ contractTypeLabel() }}</div>
            </div>
          </div>

          <div class="summary-card commission">
            <div class="icon">📈</div>
            <div class="content">
              <div class="label">Commissions</div>
              <div class="amount">{{ totalCommissions() }}€</div>
              <div class="subtitle">{{ commissionRate() }}% par réparation</div>
            </div>
          </div>

          <div class="summary-card repairs">
            <div class="icon">🔧</div>
            <div class="content">
              <div class="label">Réparations</div>
              <div class="amount">{{ completedRepairs() }}</div>
              <div class="subtitle">Terminées et payées</div>
            </div>
          </div>
        </div>

        <!-- Détail des revenus -->
        <div class="card">
          <h3>📋 Détail des Commissions par Réparation</h3>
          
          <div *ngIf="earningDetails().length > 0">
            <table class="earnings-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Réparation</th>
                  <th>Montant Total</th>
                  <th>Taux</th>
                  <th>Ma Commission</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let detail of earningDetails()">
                  <td>{{ detail.repairDate | date:'short' }}</td>
                  <td>{{ detail.clientName }}</td>
                  <td>
                    <div class="repair-details">
                      <div *ngFor="let task of detail.workOrder.tasks" class="task-item">
                        • {{ task.label }}
                      </div>
                    </div>
                  </td>
                  <td class="amount-cell">{{ detail.totalPaid }}€</td>
                  <td class="rate-cell">{{ detail.commissionRate }}%</td>
                  <td class="commission-cell">
                    <strong>{{ detail.commission }}€</strong>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="5"><strong>Total des Commissions</strong></td>
                  <td class="commission-cell">
                    <strong>{{ totalCommissions() }}€</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p *ngIf="earningDetails().length === 0" class="info">
            Aucune réparation payée pour le moment.
          </p>
        </div>

        <!-- Informations du contrat -->
        <div class="card contract-info">
          <h3>📄 Mon Contrat</h3>
          <div class="contract-details">
            <div class="detail-row">
              <span class="label">Type de contrat :</span>
              <span class="value">{{ contractTypeLabel() }}</span>
            </div>
            <div class="detail-row" *ngIf="contractType() !== 'commission'">
              <span class="label">Salaire de base :</span>
              <span class="value">{{ baseSalary() }}€ {{ contractType() === 'monthly' ? '/mois' : '/jour' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Taux de commission :</span>
              <span class="value">{{ commissionRate() }}%</span>
            </div>
            <div class="detail-row">
              <span class="label">Membre depuis :</span>
              <span class="value">{{ memberSince() | date:'longDate' }}</span>
            </div>
          </div>
        </div>

        <p class="error" *ngIf="error()">{{ error() }}</p>
      </div>
    </div>
  `,
  styles: [`
    .earnings-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .summary-card {
      background: linear-gradient(135deg, #2c3e50, #34495e);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 20px;
      border: 2px solid #34495e;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .summary-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, #e67e22, transparent);
      animation: scanLine 3s linear infinite;
    }

    .summary-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
    }

    .summary-card.total {
      border-color: #e67e22;
    }

    .summary-card.salary {
      border-color: #3498db;
    }

    .summary-card.commission {
      border-color: #27ae60;
    }

    .summary-card.repairs {
      border-color: #f39c12;
    }

    .summary-card .icon {
      font-size: 48px;
      opacity: 0.8;
    }

    .summary-card .content {
      flex: 1;
    }

    .summary-card .label {
      color: #bdc3c7;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .summary-card .amount {
      color: #ffffff;
      font-size: 32px;
      font-weight: 700;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      margin-bottom: 4px;
    }

    .summary-card .subtitle {
      color: #95a5a6;
      font-size: 12px;
    }

    .earnings-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }

    .earnings-table th,
    .earnings-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #34495e;
      color: #f8f9fa;
    }

    .earnings-table th {
      background: linear-gradient(135deg, #e67e22, #f39c12);
      color: white;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 1px;
    }

    .earnings-table tbody tr:hover {
      background: rgba(230, 126, 34, 0.1);
    }

    .repair-details {
      font-size: 13px;
    }

    .task-item {
      margin: 2px 0;
      color: #ecf0f1;
    }

    .amount-cell {
      font-weight: 600;
      color: #3498db;
    }

    .rate-cell {
      font-weight: 600;
      color: #f39c12;
    }

    .commission-cell {
      font-weight: 700;
      color: #27ae60;
      font-size: 16px;
    }

    .total-row {
      background: rgba(230, 126, 34, 0.2);
      font-size: 16px;
    }

    .total-row td {
      padding: 16px 12px;
      border-top: 2px solid #e67e22;
    }

    .contract-info {
      background: linear-gradient(135deg, #2c3e50, #34495e);
    }

    .contract-details {
      display: grid;
      gap: 16px;
      margin-top: 16px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: rgba(52, 73, 94, 0.5);
      border-radius: 8px;
      border-left: 4px solid #e67e22;
    }

    .detail-row .label {
      color: #bdc3c7;
      font-weight: 600;
    }

    .detail-row .value {
      color: #ffffff;
      font-weight: 700;
    }

    @keyframes scanLine {
      0% { left: -100%; }
      100% { left: 100%; }
    }
  `]
})
export class MechanicEarningsPageComponent {
  workOrders = signal<WorkOrder[]>([]);
  appointments = signal<Appointment[]>([]);
  error = signal<string | null>(null);

  // Informations du mécanicien connecté
  contractType = computed(() => this.authService.user?.contractType || 'commission');
  baseSalary = computed(() => this.authService.user?.baseSalary || 0);
  commissionRate = computed(() => this.authService.user?.commissionRate || 0);
  memberSince = computed(() => this.authService.user?.createdAt || new Date().toISOString());

  contractTypeLabel = computed(() => {
    const labels: Record<string, string> = {
      'monthly': 'Mensuel',
      'daily': 'Journalier',
      'commission': 'Commission uniquement'
    };
    return labels[this.contractType()] || this.contractType();
  });

  // Calculs des revenus
  earningDetails = computed(() => {
    const details: EarningDetail[] = [];
    const mechanicId = this.authService.user?.id;
    
    console.log('🔍 Debug earnings:');
    console.log('  - Mechanic ID:', mechanicId);
    console.log('  - Work Orders:', this.workOrders().length);
    console.log('  - Appointments:', this.appointments().length);
    
    if (!mechanicId) {
      console.log('  ❌ No mechanic ID');
      return details;
    }

    // Filtrer les work orders payés assignés à ce mécanicien
    const paidWorkOrders = this.workOrders().filter(wo => wo.status === 'paid');
    console.log('  - Paid Work Orders:', paidWorkOrders.length);

    for (const wo of paidWorkOrders) {
      const appointment = this.appointments().find(a => a._id === wo.appointmentId);
      console.log(`  - WO ${wo._id}:`, {
        hasAppointment: !!appointment,
        appointmentMechanicId: appointment?.mechanicId,
        matches: appointment?.mechanicId === mechanicId,
        total: wo.total
      });
      
      if (!appointment || appointment.mechanicId !== mechanicId) continue;

      const totalPaid = wo.total || 0;
      const commission = (totalPaid * this.commissionRate()) / 100;

      details.push({
        workOrder: wo,
        appointment,
        clientName: `Client #${appointment.clientId.substring(0, 8)}`,
        repairDate: wo.updatedAt || wo.createdAt || '',
        totalPaid,
        commission: Math.round(commission * 100) / 100,
        commissionRate: this.commissionRate()
      });
    }

    // Trier par date décroissante
    return details.sort((a, b) => 
      new Date(b.repairDate).getTime() - new Date(a.repairDate).getTime()
    );
  });

  totalCommissions = computed(() => {
    return Math.round(
      this.earningDetails().reduce((sum, detail) => sum + detail.commission, 0) * 100
    ) / 100;
  });

  completedRepairs = computed(() => this.earningDetails().length);

  totalEarnings = computed(() => {
    // Pour un contrat mensuel ou journalier, on ajoute le salaire de base
    // Note: Ici on affiche juste le salaire mensuel + commissions
    // Dans une vraie app, il faudrait calculer le nombre de mois/jours travaillés
    const commissions = this.totalCommissions();
    
    if (this.contractType() === 'commission') {
      return commissions;
    }
    
    // Pour simplifier, on affiche salaire mensuel + commissions
    return Math.round((this.baseSalary() + commissions) * 100) / 100;
  });

  constructor(
    private workOrdersService: WorkOrdersService,
    private appointmentsService: AppointmentsService,
    private authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      const [workOrders, appointments] = await Promise.all([
        this.workOrdersService.list(),
        this.appointmentsService.list()
      ]);

      this.workOrders.set(workOrders);
      this.appointments.set(appointments);
      // Note: On n'a pas besoin de charger les users car on affiche juste l'ID client
      // Dans une version future, on pourrait populer les noms côté backend
    } catch (error: any) {
      this.error.set('Erreur lors du chargement des données');
      console.error('Error loading earnings data:', error);
    }
  }
}
