import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
  imports: [CommonModule, RouterLink],
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

        <!-- Détail mensuel des salaires -->
        <div class="card" *ngIf="contractType() !== 'commission'">
          <h3>📅 Détail Mensuel des Salaires</h3>
          
          <div class="calculation-method-info">
            <div class="method-badge" [class.declared]="hasWorkDayDeclarations()">
              {{ hasWorkDayDeclarations() ? '✅ Basé sur vos déclarations' : '📊 Calcul théorique' }}
            </div>
            <p *ngIf="!hasWorkDayDeclarations()" class="method-note">
              💡 <strong>Astuce :</strong> Déclarez vos jours de travail dans 
              <a routerLink="/mechanic/workdays" class="link">📅 Mes Jours de Travail</a> 
              pour un calcul précis de votre salaire !
            </p>
          </div>
          
          <div class="monthly-breakdown">
            <div class="breakdown-header">
              <div class="month-col">Mois</div>
              <div class="days-col">Jours Ouvrés</div>
              <div class="base-col">Salaire Base</div>
              <div class="comm-col">Commissions</div>
              <div class="total-col">Total</div>
            </div>
            
            <div class="breakdown-row" *ngFor="let month of monthlyBreakdown()">
              <div class="month-col">
                {{ month.name }}
                <div class="calculation-indicator" *ngIf="month.calculationMethod">
                  <span *ngIf="month.calculationMethod === 'declared_days'" class="declared-indicator">📋 Déclaré</span>
                  <span *ngIf="month.calculationMethod === 'theoretical_days'" class="theoretical-indicator">📊 Théorique</span>
                </div>
              </div>
              <div class="days-col">{{ month.workingDays }}</div>
              <div class="base-col">{{ month.baseSalary }}€</div>
              <div class="comm-col">{{ month.commissions }}€</div>
              <div class="total-col">{{ month.total }}€</div>
            </div>
            
            <div class="breakdown-footer">
              <div class="month-col"><strong>TOTAL</strong></div>
              <div class="days-col">{{ totalWorkingDays() }}</div>
              <div class="base-col"><strong>{{ totalBaseSalaryBreakdown() }}€</strong></div>
              <div class="comm-col"><strong>{{ totalCommissions() }}€</strong></div>
              <div class="total-col"><strong>{{ totalEarnings() }}€</strong></div>
            </div>
          </div>
          
          <div class="calculation-note">
            <p><strong>💡 Note sur le calcul :</strong></p>
            <ul>
              <li *ngIf="contractType() === 'monthly'">Salaire mensuel proratisé selon les jours ouvrés réels (hors weekends et jours fériés)</li>
              <li *ngIf="contractType() === 'daily'">Salaire journalier × nombre de jours ouvrés dans le mois</li>
              <li>Les mois partiels (embauche/départ) sont calculés au prorata</li>
              <li>Les commissions s'ajoutent au salaire de base</li>
              <li *ngIf="hasWorkDayDeclarations()">✅ Calcul basé sur vos déclarations de présence approuvées</li>
              <li *ngIf="!hasWorkDayDeclarations()">📊 Calcul théorique - déclarez vos jours pour plus de précision</li>
            </ul>
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
            <div class="detail-row" *ngIf="contractType() === 'monthly'">
              <span class="label">Calcul salaire :</span>
              <span class="value">Salaire mensuel fixe + commissions variables</span>
            </div>
            <div class="detail-row" *ngIf="contractType() === 'daily'">
              <span class="label">Calcul salaire :</span>
              <span class="value">Salaire journalier × jours ouvrés + commissions</span>
            </div>
            <div class="detail-row" *ngIf="contractType() === 'commission'">
              <span class="label">Calcul salaire :</span>
              <span class="value">Commissions uniquement ({{ commissionRate() }}% du CA)</span>
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

    .calculation-method-info {
      margin-bottom: 20px;
      padding: 16px;
      border-radius: 8px;
      background: rgba(52, 152, 219, 0.1);
      border-left: 4px solid #3498db;
    }

    .method-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 12px;
      background: rgba(149, 165, 166, 0.2);
      color: #95a5a6;
      border: 2px solid #95a5a6;
    }

    .method-badge.declared {
      background: rgba(39, 174, 96, 0.2);
      color: #27ae60;
      border-color: #27ae60;
    }

    .method-note {
      margin: 0;
      color: #ecf0f1;
      font-size: 14px;
    }

    .method-note .link {
      color: #3498db;
      text-decoration: none;
      font-weight: 600;
    }

    .method-note .link:hover {
      text-decoration: underline;
    }

    .calculation-indicator {
      font-size: 10px;
      margin-top: 4px;
    }

    .declared-indicator {
      color: #27ae60;
      font-weight: 600;
    }

    .theoretical-indicator {
      color: #95a5a6;
      font-weight: 600;
    }

    .monthly-breakdown {
      margin-top: 16px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #34495e;
    }

    .breakdown-header,
    .breakdown-row,
    .breakdown-footer {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
      gap: 16px;
      padding: 12px 16px;
      align-items: center;
    }

    .breakdown-header {
      background: linear-gradient(135deg, #e67e22, #f39c12);
      color: white;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 1px;
    }

    .breakdown-row {
      background: rgba(52, 73, 94, 0.3);
      border-bottom: 1px solid #34495e;
      color: #ecf0f1;
    }

    .breakdown-row:hover {
      background: rgba(230, 126, 34, 0.1);
    }

    .breakdown-footer {
      background: rgba(230, 126, 34, 0.2);
      color: #ffffff;
      font-weight: 700;
      border-top: 2px solid #e67e22;
    }

    .month-col {
      font-weight: 600;
    }

    .days-col,
    .base-col,
    .comm-col,
    .total-col {
      text-align: right;
      font-family: 'Courier New', monospace;
    }

    .base-col {
      color: #3498db;
    }

    .comm-col {
      color: #27ae60;
    }

    .total-col {
      color: #e67e22;
      font-weight: 600;
    }

    .calculation-note {
      margin-top: 20px;
      padding: 16px;
      background: rgba(52, 152, 219, 0.1);
      border-left: 4px solid #3498db;
      border-radius: 4px;
    }

    .calculation-note p {
      margin: 0 0 12px 0;
      color: #3498db;
      font-weight: 600;
    }

    .calculation-note ul {
      margin: 0;
      padding-left: 20px;
      color: #ecf0f1;
    }

    .calculation-note li {
      margin-bottom: 8px;
      font-size: 14px;
    }

    @keyframes scanLine {
      0% { left: -100%; }
      100% { left: 100%; }
    }

    /* Responsive pour mobile */
    @media (max-width: 768px) {
      .breakdown-header,
      .breakdown-row,
      .breakdown-footer {
        grid-template-columns: 1fr;
        gap: 8px;
        text-align: left;
      }

      .breakdown-header > div,
      .breakdown-row > div,
      .breakdown-footer > div {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .breakdown-header > div::before,
      .breakdown-row > div::before,
      .breakdown-footer > div::before {
        content: attr(data-label);
        font-weight: 600;
        color: #bdc3c7;
      }

      .days-col::before { content: "Jours: "; }
      .base-col::before { content: "Base: "; }
      .comm-col::before { content: "Comm: "; }
      .total-col::before { content: "Total: "; }
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

  // Détail mensuel des salaires
  monthlyBreakdown = computed(() => {
    const contractType = this.contractType();
    const baseSalary = this.baseSalary();
    
    if (contractType === 'commission') {
      return [];
    }
    
    const memberSinceDate = new Date(this.memberSince());
    const now = new Date();
    const breakdown: any[] = [];
    
    // Grouper les commissions par mois
    const monthlyCommissions: Record<string, number> = {};
    this.earningDetails().forEach(detail => {
      const date = new Date(detail.repairDate);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyCommissions[monthKey] = (monthlyCommissions[monthKey] || 0) + detail.commission;
    });
    
    // Calculer mois par mois depuis l'inscription
    let currentDate = new Date(memberSinceDate.getFullYear(), memberSinceDate.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const monthKey = `${year}-${month}`;
      const isFirstMonth = year === memberSinceDate.getFullYear() && month === memberSinceDate.getMonth();
      const isLastMonth = year === now.getFullYear() && month === now.getMonth();
      
      const workingDaysInMonth = this.getWorkingDaysInMonth(year, month);
      let monthBaseSalary = 0;
      let actualWorkedDays = workingDaysInMonth;
      
      if (contractType === 'monthly') {
        if (isFirstMonth && memberSinceDate.getDate() > 1) {
          // Mois partiel (embauche en cours de mois)
          const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
          const workedDays = totalDaysInMonth - memberSinceDate.getDate() + 1;
          actualWorkedDays = Math.round((workedDays / totalDaysInMonth) * workingDaysInMonth);
          monthBaseSalary = (baseSalary / workingDaysInMonth) * actualWorkedDays;
        } else if (isLastMonth && now.getDate() < new Date(year, month + 1, 0).getDate()) {
          // Mois partiel (calcul jusqu'à une date précise)
          actualWorkedDays = Math.round((now.getDate() / new Date(year, month + 1, 0).getDate()) * workingDaysInMonth);
          monthBaseSalary = (baseSalary / workingDaysInMonth) * actualWorkedDays;
        } else {
          // Mois complet
          monthBaseSalary = baseSalary;
        }
      } else if (contractType === 'daily') {
        if (isFirstMonth && memberSinceDate.getDate() > 1) {
          const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
          const workedDays = totalDaysInMonth - memberSinceDate.getDate() + 1;
          actualWorkedDays = Math.round((workedDays / totalDaysInMonth) * workingDaysInMonth);
        } else if (isLastMonth && now.getDate() < new Date(year, month + 1, 0).getDate()) {
          const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
          actualWorkedDays = Math.round((now.getDate() / totalDaysInMonth) * workingDaysInMonth);
        }
        
        monthBaseSalary = baseSalary * actualWorkedDays;
      }
      
      const monthCommissions = monthlyCommissions[monthKey] || 0;
      
      breakdown.push({
        name: currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        workingDays: actualWorkedDays,
        baseSalary: Math.round(monthBaseSalary * 100) / 100,
        commissions: Math.round(monthCommissions * 100) / 100,
        total: Math.round((monthBaseSalary + monthCommissions) * 100) / 100
      });
      
      // Passer au mois suivant
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return breakdown.reverse(); // Plus récent en premier
  });

  totalWorkingDays = computed(() => {
    return this.monthlyBreakdown().reduce((sum, month) => sum + month.workingDays, 0);
  });

  totalBaseSalaryBreakdown = computed(() => {
    return Math.round(this.monthlyBreakdown().reduce((sum, month) => sum + month.baseSalary, 0) * 100) / 100;
  });

  // Vérifier si on a des déclarations de jours de travail
  hasWorkDayDeclarations = computed(() => {
    // Pour l'instant, on simule - dans une vraie implémentation, 
    // on vérifierait s'il y a des WorkDay approuvés pour ce mécanicien
    return false; // TODO: implémenter la vérification réelle
  });

  completedRepairs = computed(() => this.earningDetails().length);

  // Calcul précis des revenus totaux
  totalEarnings = computed(() => {
    const commissions = this.totalCommissions();
    const contractType = this.contractType();
    const baseSalary = this.baseSalary();
    
    if (contractType === 'commission') {
      return commissions;
    }
    
    // Calcul précis basé sur les jours ouvrés réels
    const memberSinceDate = new Date(this.memberSince());
    const now = new Date();
    
    let totalBaseSalary = 0;
    
    // Calculer mois par mois depuis l'inscription
    let currentDate = new Date(memberSinceDate.getFullYear(), memberSinceDate.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const isFirstMonth = year === memberSinceDate.getFullYear() && month === memberSinceDate.getMonth();
      const isLastMonth = year === now.getFullYear() && month === now.getMonth();
      
      if (contractType === 'monthly') {
        if (isFirstMonth && memberSinceDate.getDate() > 1) {
          // Mois partiel (embauche en cours de mois)
          const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
          const workedDays = totalDaysInMonth - memberSinceDate.getDate() + 1;
          const workingDaysInMonth = this.getWorkingDaysInMonth(year, month);
          const actualWorkedDays = Math.round((workedDays / totalDaysInMonth) * workingDaysInMonth);
          totalBaseSalary += (baseSalary / workingDaysInMonth) * actualWorkedDays;
        } else if (isLastMonth && now.getDate() < new Date(year, month + 1, 0).getDate()) {
          // Mois partiel (calcul jusqu'à une date précise)
          const workingDaysInMonth = this.getWorkingDaysInMonth(year, month);
          const workedDays = Math.round((now.getDate() / new Date(year, month + 1, 0).getDate()) * workingDaysInMonth);
          totalBaseSalary += (baseSalary / workingDaysInMonth) * workedDays;
        } else {
          // Mois complet
          totalBaseSalary += baseSalary;
        }
      } else if (contractType === 'daily') {
        const workingDaysInMonth = this.getWorkingDaysInMonth(year, month);
        let actualWorkedDays = workingDaysInMonth;
        
        if (isFirstMonth && memberSinceDate.getDate() > 1) {
          const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
          const workedDays = totalDaysInMonth - memberSinceDate.getDate() + 1;
          actualWorkedDays = Math.round((workedDays / totalDaysInMonth) * workingDaysInMonth);
        } else if (isLastMonth && now.getDate() < new Date(year, month + 1, 0).getDate()) {
          const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
          actualWorkedDays = Math.round((now.getDate() / totalDaysInMonth) * workingDaysInMonth);
        }
        
        totalBaseSalary += baseSalary * actualWorkedDays;
      }
      
      // Passer au mois suivant
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return Math.round((totalBaseSalary + commissions) * 100) / 100;
  });

  // Méthode helper pour calculer les jours ouvrés dans un mois
  private getWorkingDaysInMonth(year: number, month: number): number {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Jours fériés fixes (approximation)
    const publicHolidays = [
      new Date(year, 0, 1),   // Nouvel An
      new Date(year, 4, 1),   // Fête du Travail
      new Date(year, 4, 8),   // Victoire 1945
      new Date(year, 6, 14),  // Fête Nationale
      new Date(year, 7, 15),  // Assomption
      new Date(year, 10, 1),  // Toussaint
      new Date(year, 10, 11), // Armistice
      new Date(year, 11, 25), // Noël
    ];
    
    let workingDays = 0;
    let currentDate = new Date(firstDay);
    
    while (currentDate <= lastDay) {
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Dimanche = 0, Samedi = 6
      const isPublicHoliday = publicHolidays.some(holiday => 
        holiday.getTime() === currentDate.getTime()
      );
      
      if (!isWeekend && !isPublicHoliday) {
        workingDays++;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
  }

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
