import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkdaysService, type WorkDay } from '../../core/services/workdays.service';

@Component({
  standalone: true,
  selector: 'app-mechanic-workdays-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-mechanic-theme">
      <div class="wrap">
        <h2>📅 Mes Jours de Travail</h2>

        <!-- Sélecteur de mois -->
        <div class="month-selector">
          <button (click)="previousMonth()" class="nav-btn">‹</button>
          <h3>{{ currentMonthLabel() }}</h3>
          <button (click)="nextMonth()" class="nav-btn">›</button>
        </div>

        <!-- Calendrier des jours ouvrés -->
        <div class="calendar-section">
          <h4>🗓️ Calendrier du Mois</h4>
          <div class="calendar-grid">
            <div 
              *ngFor="let day of workingDaysInMonth()" 
              class="calendar-day"
              [class.declared]="isDayDeclared(day)"
              [class.approved]="isDayApproved(day)"
              [class.rejected]="isDayRejected(day)"
              [class.today]="isToday(day)"
              [class.future]="isFuture(day)"
              (click)="toggleDay(day)"
            >
              <div class="day-number">{{ day.getDate() }}</div>
              <div class="day-status">
                <span *ngIf="getDayStatus(day) === 'declared'">⏳</span>
                <span *ngIf="getDayStatus(day) === 'approved'">✅</span>
                <span *ngIf="getDayStatus(day) === 'rejected'">❌</span>
              </div>
            </div>
          </div>
          
          <div class="calendar-legend">
            <div class="legend-item">
              <div class="legend-color today"></div>
              <span>Aujourd'hui</span>
            </div>
            <div class="legend-item">
              <div class="legend-color declared"></div>
              <span>En attente</span>
            </div>
            <div class="legend-item">
              <div class="legend-color approved"></div>
              <span>Approuvé</span>
            </div>
            <div class="legend-item">
              <div class="legend-color rejected"></div>
              <span>Rejeté</span>
            </div>
          </div>
        </div>

        <!-- Déclaration rapide -->
        <div class="card">
          <h4>⚡ Déclaration Rapide</h4>
          <div class="quick-declare">
            <div class="form-group">
              <label>Heures par jour :</label>
              <input 
                type="number" 
                [(ngModel)]="defaultHours" 
                min="1" 
                max="24" 
                step="0.5"
                class="form-control"
              >
            </div>
            <div class="form-group">
              <label>Notes (optionnel) :</label>
              <textarea 
                [(ngModel)]="defaultNotes" 
                class="form-control"
                rows="2"
                placeholder="Commentaires sur votre journée de travail..."
              ></textarea>
            </div>
            <div class="quick-actions">
              <button 
                (click)="declareWeek()" 
                class="btn btn-primary"
                [disabled]="loading()"
              >
                📅 Déclarer la semaine
              </button>
              <button 
                (click)="declareMonth()" 
                class="btn btn-secondary"
                [disabled]="loading()"
              >
                🗓️ Déclarer le mois
              </button>
            </div>
          </div>
        </div>

        <!-- Liste des déclarations -->
        <div class="card">
          <h4>📋 Mes Déclarations</h4>
          
          <div *ngIf="workDays().length > 0" class="workdays-list">
            <div 
              *ngFor="let workDay of workDays()" 
              class="workday-item"
              [class.approved]="workDay.status === 'approved'"
              [class.rejected]="workDay.status === 'rejected'"
              [class.declared]="workDay.status === 'declared'"
            >
              <div class="workday-date">
                <strong>{{ formatDate(workDay.date) }}</strong>
                <span class="day-name">{{ getDayName(workDay.date) }}</span>
              </div>
              <div class="workday-details">
                <div class="hours">{{ workDay.hoursWorked }}h</div>
                <div class="status" [style.color]="getStatusColor(workDay.status)">
                  {{ getStatusLabel(workDay.status) }}
                </div>
              </div>
              <div class="workday-notes" *ngIf="workDay.notes">
                <small>{{ workDay.notes }}</small>
              </div>
              <div class="workday-rejection" *ngIf="workDay.status === 'rejected' && workDay.rejectionReason">
                <small class="rejection-reason">❌ {{ workDay.rejectionReason }}</small>
              </div>
            </div>
          </div>

          <p *ngIf="workDays().length === 0" class="info">
            Aucune déclaration pour ce mois.
          </p>
        </div>

        <!-- Statistiques -->
        <div class="card stats-card">
          <h4>📊 Statistiques du Mois</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ approvedDays() }}</div>
              <div class="stat-label">Jours approuvés</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ pendingDays() }}</div>
              <div class="stat-label">En attente</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ totalHours() }}h</div>
              <div class="stat-label">Heures approuvées</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ workingDaysInMonth().length }}</div>
              <div class="stat-label">Jours ouvrés</div>
            </div>
          </div>
        </div>

        <p class="error" *ngIf="error()">{{ error() }}</p>
        <p class="success" *ngIf="success()">{{ success() }}</p>
      </div>
    </div>
  `,
  styles: [`
    .month-selector {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin-bottom: 30px;
    }

    .nav-btn {
      background: linear-gradient(135deg, #e67e22, #f39c12);
      border: none;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .nav-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 5px 15px rgba(230, 126, 34, 0.4);
    }

    .calendar-section {
      margin-bottom: 30px;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 10px;
      margin: 20px 0;
    }

    .calendar-day {
      aspect-ratio: 1;
      border: 2px solid #34495e;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: rgba(52, 73, 94, 0.3);
      position: relative;
    }

    .calendar-day:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }

    .calendar-day.today {
      border-color: #3498db;
      background: rgba(52, 152, 219, 0.2);
    }

    .calendar-day.declared {
      border-color: #f39c12;
      background: rgba(243, 156, 18, 0.2);
    }

    .calendar-day.approved {
      border-color: #27ae60;
      background: rgba(39, 174, 96, 0.2);
    }

    .calendar-day.rejected {
      border-color: #e74c3c;
      background: rgba(231, 76, 60, 0.2);
    }

    .calendar-day.future {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .day-number {
      font-size: 16px;
      font-weight: 600;
      color: #ecf0f1;
    }

    .day-status {
      font-size: 12px;
      margin-top: 4px;
    }

    .calendar-legend {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 20px;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #bdc3c7;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      border: 2px solid;
    }

    .legend-color.today {
      background: rgba(52, 152, 219, 0.2);
      border-color: #3498db;
    }

    .legend-color.declared {
      background: rgba(243, 156, 18, 0.2);
      border-color: #f39c12;
    }

    .legend-color.approved {
      background: rgba(39, 174, 96, 0.2);
      border-color: #27ae60;
    }

    .legend-color.rejected {
      background: rgba(231, 76, 60, 0.2);
      border-color: #e74c3c;
    }

    .quick-declare {
      display: grid;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      color: #bdc3c7;
      font-weight: 600;
    }

    .form-control {
      padding: 12px;
      border: 2px solid #34495e;
      border-radius: 8px;
      background: rgba(52, 73, 94, 0.3);
      color: #ecf0f1;
      font-size: 14px;
    }

    .form-control:focus {
      outline: none;
      border-color: #e67e22;
      box-shadow: 0 0 0 3px rgba(230, 126, 34, 0.2);
    }

    .quick-actions {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #e67e22, #f39c12);
      color: white;
    }

    .btn-secondary {
      background: linear-gradient(135deg, #34495e, #2c3e50);
      color: white;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .workdays-list {
      display: grid;
      gap: 15px;
    }

    .workday-item {
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid;
      background: rgba(52, 73, 94, 0.3);
      transition: all 0.3s ease;
    }

    .workday-item.declared {
      border-left-color: #f39c12;
    }

    .workday-item.approved {
      border-left-color: #27ae60;
    }

    .workday-item.rejected {
      border-left-color: #e74c3c;
    }

    .workday-item:hover {
      background: rgba(52, 73, 94, 0.5);
    }

    .workday-date {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .workday-date strong {
      color: #ecf0f1;
      font-size: 16px;
    }

    .day-name {
      color: #bdc3c7;
      font-size: 14px;
    }

    .workday-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .hours {
      color: #3498db;
      font-weight: 600;
    }

    .status {
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 1px;
    }

    .workday-notes {
      color: #95a5a6;
      font-style: italic;
      margin-bottom: 8px;
    }

    .rejection-reason {
      color: #e74c3c;
      font-weight: 600;
    }

    .stats-card {
      background: linear-gradient(135deg, #2c3e50, #34495e);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 20px;
      margin-top: 16px;
    }

    .stat-item {
      text-align: center;
      padding: 16px;
      background: rgba(230, 126, 34, 0.1);
      border-radius: 8px;
      border: 1px solid rgba(230, 126, 34, 0.3);
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #e67e22;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: #bdc3c7;
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

    .info {
      color: #95a5a6;
      text-align: center;
      padding: 20px;
      font-style: italic;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .calendar-grid {
        grid-template-columns: repeat(4, 1fr);
      }
      
      .quick-actions {
        flex-direction: column;
      }
      
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class MechanicWorkdaysPageComponent {
  workDays = signal<WorkDay[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // État du calendrier
  currentDate = signal(new Date());
  defaultHours = signal(8);
  defaultNotes = signal('');

  constructor(private workdaysService: WorkdaysService) {}

  async ngOnInit(): Promise<void> {
    await this.loadWorkDays();
  }

  // Computed properties
  currentMonthLabel = computed(() => {
    const date = this.currentDate();
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  });

  workingDaysInMonth = computed(() => {
    const date = this.currentDate();
    return this.workdaysService.getWorkingDaysInMonth(date.getFullYear(), date.getMonth());
  });

  approvedDays = computed(() => {
    return this.workDays().filter(wd => wd.status === 'approved').length;
  });

  pendingDays = computed(() => {
    return this.workDays().filter(wd => wd.status === 'declared').length;
  });

  totalHours = computed(() => {
    return this.workDays()
      .filter(wd => wd.status === 'approved')
      .reduce((sum, wd) => sum + wd.hoursWorked, 0);
  });

  // Navigation
  previousMonth(): void {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    this.loadWorkDays();
  }

  nextMonth(): void {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    this.loadWorkDays();
  }

  // Chargement des données
  async loadWorkDays(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);
      
      const date = this.currentDate();
      const workDays = await this.workdaysService.getMyWorkDays(
        date.getMonth() + 1, // API attend mois en base 1
        date.getFullYear()
      );
      
      this.workDays.set(workDays);
    } catch (error: any) {
      this.error.set('Erreur lors du chargement des jours de travail');
      console.error('Error loading work days:', error);
    } finally {
      this.loading.set(false);
    }
  }

  // Gestion du calendrier
  isDayDeclared(day: Date): boolean {
    return this.workDays().some(wd => 
      new Date(wd.date).toDateString() === day.toDateString()
    );
  }

  isDayApproved(day: Date): boolean {
    return this.workDays().some(wd => 
      new Date(wd.date).toDateString() === day.toDateString() && wd.status === 'approved'
    );
  }

  isDayRejected(day: Date): boolean {
    return this.workDays().some(wd => 
      new Date(wd.date).toDateString() === day.toDateString() && wd.status === 'rejected'
    );
  }

  getDayStatus(day: Date): string | null {
    const workDay = this.workDays().find(wd => 
      new Date(wd.date).toDateString() === day.toDateString()
    );
    return workDay?.status || null;
  }

  isToday(day: Date): boolean {
    const today = new Date();
    return day.toDateString() === today.toDateString();
  }

  isFuture(day: Date): boolean {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return day > today;
  }

  // Actions
  async toggleDay(day: Date): Promise<void> {
    if (this.isFuture(day) || this.loading()) return;

    try {
      this.loading.set(true);
      this.error.set(null);
      this.success.set(null);

      const dateStr = this.workdaysService.formatDate(day);
      
      if (this.isDayDeclared(day)) {
        // Pour l'instant, on ne permet pas de supprimer une déclaration
        this.error.set('Impossible de modifier une déclaration existante');
        return;
      }

      const result = await this.workdaysService.declareWorkDay(
        dateStr,
        this.defaultHours(),
        this.defaultNotes() || undefined
      );

      this.success.set(result.message);
      await this.loadWorkDays();

    } catch (error: any) {
      this.error.set(error.error?.message || 'Erreur lors de la déclaration');
    } finally {
      this.loading.set(false);
    }
  }

  async declareWeek(): Promise<void> {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi

    const weekDays: string[] = [];
    for (let i = 0; i < 5; i++) { // Lundi à vendredi
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      
      if (day <= today && this.workdaysService.isWorkingDay(day)) {
        weekDays.push(this.workdaysService.formatDate(day));
      }
    }

    if (weekDays.length === 0) {
      this.error.set('Aucun jour ouvré à déclarer cette semaine');
      return;
    }

    await this.declareMultipleDays(weekDays);
  }

  async declareMonth(): Promise<void> {
    const today = new Date();
    const workingDays = this.workingDaysInMonth()
      .filter(day => day <= today)
      .map(day => this.workdaysService.formatDate(day));

    if (workingDays.length === 0) {
      this.error.set('Aucun jour ouvré à déclarer ce mois');
      return;
    }

    await this.declareMultipleDays(workingDays);
  }

  private async declareMultipleDays(dates: string[]): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);
      this.success.set(null);

      const result = await this.workdaysService.declareMultipleWorkDays(
        dates,
        this.defaultHours(),
        this.defaultNotes() || undefined
      );

      if (result.errors.length > 0) {
        const errorMsg = result.errors.map(e => `${e.date}: ${e.error}`).join(', ');
        this.error.set(`Erreurs: ${errorMsg}`);
      }

      if (result.results.length > 0) {
        this.success.set(result.message);
      }

      await this.loadWorkDays();

    } catch (error: any) {
      this.error.set(error.error?.message || 'Erreur lors de la déclaration multiple');
    } finally {
      this.loading.set(false);
    }
  }

  // Utilitaires
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  getDayName(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long' });
  }

  getStatusLabel(status: string): string {
    return this.workdaysService.getStatusLabel(status);
  }

  getStatusColor(status: string): string {
    return this.workdaysService.getStatusColor(status);
  }
}