import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsService } from '../../core/services/appointments.service';
import { WorkOrdersService } from '../../core/services/workorders.service';
import { VehiclesService } from '../../core/services/vehicles.service';
import { UsersService } from '../../core/services/users.service';
import type { Appointment, WorkOrder, WorkOrderTask, Vehicle, User } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-mechanic-workorders-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-mechanic-theme">
      <div class="wrap">
      <div class="version-indicator">
        🔧 Interface Mécanicien v2.0 - Nouvelle Version avec Estimations
      </div>
      
      <h2>Mes estimations et réparations (mécanicien)</h2>

      <!-- Debug Info -->
      <div class="debug-card">
        <h4>🔍 Debug Info (Version de test)</h4>
        <div class="debug-info">
          <p><strong>Rendez-vous chargés:</strong> {{ appointments().length }}</p>
          <p><strong>Work orders chargés:</strong> {{ workOrders().length }}</p>
          <p><strong>Véhicules chargés:</strong> {{ vehicles().length }}</p>
          <p><strong>Rendez-vous à estimer:</strong> {{ appointmentsToEstimate().length }}</p>
          <p><strong>Réparations approuvées:</strong> {{ approvedWorkOrders().length }}</p>
          <p><strong>En attente approbation:</strong> {{ pendingWorkOrders().length }}</p>
        </div>
      </div>

      <!-- Rendez-vous en diagnostic -->
      <div class="card">
        <h3>Rendez-vous à diagnostiquer</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Véhicule</th>
              <th>Problème signalé</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of appointmentsToEstimate()">
              <td>{{ a.scheduledAt ? (a.scheduledAt | date : 'short') : '-' }}</td>
              <td>{{ getVehicleInfo(a.vehicleId) }}</td>
              <td>{{ a.clientNote || 'Aucune note' }}</td>
              <td>
                <button (click)="startDiagnostic(a._id)" [disabled]="processing()">
                  Commencer diagnostic
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="appointmentsToEstimate().length === 0" class="info">
          Aucun rendez-vous à diagnostiquer.
        </p>
      </div>

      <!-- Créer des estimations -->
      <div class="card">
        <h3>Créer une estimation</h3>
        <table>
          <thead>
            <tr>
              <th>Véhicule</th>
              <th>Diagnostic</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let w of workOrdersToEstimate()">
              <td>{{ w.appointmentId.substring(0, 8) }}...</td>
              <td>
                <textarea 
                  [(ngModel)]="estimationNotes[w._id]" 
                  placeholder="Diagnostic détaillé..."
                  rows="2">
                </textarea>
              </td>
              <td>{{ w.status }}</td>
              <td>
                <button (click)="openEstimationModal(w)" class="estimate-btn">
                  Créer estimation
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Réparations autorisées -->
      <div class="card">
        <h3>Réparations autorisées</h3>
        <table>
          <thead>
            <tr>
              <th>Véhicule</th>
              <th>Estimation</th>
              <th>Statut client</th>
              <th>Statut rendez-vous</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let w of approvedWorkOrders()">
              <td>{{ w.appointmentId.substring(0, 8) }}...</td>
              <td>{{ w.total }}€</td>
              <td>
                <span class="status status-approved">Approuvé</span>
              </td>
              <td>
                <span class="status" [class]="'status-' + getAppointmentStatus(w.appointmentId)">
                  {{ getAppointmentStatus(w.appointmentId) }}
                </span>
              </td>
              <td>
                <button 
                  *ngIf="getAppointmentStatus(w.appointmentId) === 'confirmed'" 
                  (click)="startRepair(w.appointmentId)" 
                  [disabled]="processing()">
                  Commencer réparation
                </button>
                <button 
                  *ngIf="getAppointmentStatus(w.appointmentId) === 'in_progress'" 
                  (click)="finishRepair(w.appointmentId)" 
                  [disabled]="processing()">
                  Terminer réparation
                </button>
                <span 
                  *ngIf="getAppointmentStatus(w.appointmentId) === 'done'" 
                  class="completed">
                  ✓ Terminé
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="approvedWorkOrders().length === 0" class="info">
          Aucune réparation autorisée pour le moment.
        </p>
      </div>

      <!-- Réparations en attente d'approbation -->
      <div class="card">
        <h3>En attente d'approbation client</h3>
        <table>
          <thead>
            <tr>
              <th>Véhicule</th>
              <th>Estimation</th>
              <th>Statut</th>
              <th>Info</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let w of pendingWorkOrders()">
              <td>{{ w.appointmentId.substring(0, 8) }}...</td>
              <td>{{ w.total }}€</td>
              <td>
                <span class="status status-pending">{{ getStatusLabel(w.status) }}</span>
              </td>
              <td class="info-text">
                <span *ngIf="w.status === 'pending_client_approval'">
                  Le client examine votre estimation
                </span>
                <span *ngIf="w.status === 'rejected'" class="rejected">
                  Estimation refusée par le client
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="pendingWorkOrders().length === 0" class="info">
          Aucune estimation en attente.
        </p>
      </div>

      <!-- Modal d'estimation -->
      <div class="modal" *ngIf="showEstimationModal()" (click)="closeEstimationModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>Estimation pour {{ selectedWorkOrder()?.appointmentId?.substring(0, 8) }}...</h3>
          
          <div class="estimation-form">
            <label>Note de diagnostic :</label>
            <textarea 
              [(ngModel)]="currentEstimationNote" 
              placeholder="Décrivez le problème et les réparations nécessaires..."
              rows="3">
            </textarea>

            <label>Tâches et prix :</label>
            <div class="tasks-list">
              <div *ngFor="let task of currentTasks(); let i = index" class="task-row">
                <input 
                  [(ngModel)]="task.label" 
                  placeholder="Description de la tâche"
                  class="task-label">
                <input 
                  [(ngModel)]="task.price" 
                  type="number" 
                  placeholder="Prix"
                  class="task-price">
                <button (click)="removeTask(i)" class="remove-btn">×</button>
              </div>
              <button (click)="addTask()" class="add-task-btn">+ Ajouter une tâche</button>
            </div>

            <div class="total">
              <strong>Total : {{ calculateTotal() }}€</strong>
            </div>

            <div class="modal-actions">
              <button (click)="saveEstimation()" [disabled]="processing()" class="save-btn">
                Envoyer estimation
              </button>
              <button (click)="closeEstimationModal()" class="cancel-btn">
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>

      <p class="error" *ngIf="error()">{{ error() }}</p>
      <p class="success" *ngIf="success()">{{ success() }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .wrap {
        max-width: 1200px;
        margin: 16px auto;
        padding: 0 12px;
      }
      .version-indicator {
        background: linear-gradient(135deg, #4caf50, #2196f3);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        text-align: center;
        font-weight: 600;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .debug-card {
        background: #fff3e0;
        border: 2px solid #ff9800;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      }
      .debug-card h4 {
        margin: 0 0 12px 0;
        color: #e65100;
      }
      .debug-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 8px;
      }
      .debug-info p {
        margin: 4px 0;
        padding: 8px;
        background: white;
        border-radius: 4px;
        border-left: 4px solid #ff9800;
      }
      .card {
        margin-top: 12px;
        padding: 12px;
        border: 1px solid #e3e3e3;
        border-radius: 10px;
        background: #fff;
        overflow: auto;
      }
      .card h3 {
        margin-top: 0;
        color: #333;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
      }
      th, td {
        text-align: left;
        padding: 8px;
        border-bottom: 1px solid #eee;
        font-size: 14px;
      }
      th {
        background: #f5f5f5;
        font-weight: 600;
      }
      button {
        padding: 8px 12px;
        border-radius: 8px;
        border: 0;
        background: #0b57d0;
        color: #fff;
        cursor: pointer;
        font-size: 12px;
      }
      button:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
      .estimate-btn {
        background: #ff9800;
      }
      textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        resize: vertical;
      }
      .status {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      }
      .status-approved {
        background: #e8f5e8;
        color: #2e7d32;
      }
      .status-pending {
        background: #fff3e0;
        color: #e65100;
      }
      .status-confirmed {
        background: #e3f2fd;
        color: #1976d2;
      }
      .status-in_progress {
        background: #fff3e0;
        color: #f57c00;
      }
      .status-done {
        background: #e8f5e8;
        color: #388e3c;
      }
      .completed {
        color: #4caf50;
        font-weight: 600;
      }
      .rejected {
        color: #f44336;
        font-weight: 500;
      }
      .info-text {
        font-size: 12px;
        font-style: italic;
      }
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal-content {
        background: white;
        padding: 20px;
        border-radius: 10px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
      }
      .estimation-form label {
        display: block;
        margin: 16px 0 4px 0;
        font-weight: 600;
      }
      .tasks-list {
        border: 1px solid #eee;
        padding: 12px;
        border-radius: 4px;
      }
      .task-row {
        display: grid;
        grid-template-columns: 2fr 1fr auto;
        gap: 8px;
        margin-bottom: 8px;
        align-items: center;
      }
      .task-label, .task-price {
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      .remove-btn {
        background: #f44336;
        width: 30px;
        height: 30px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .add-task-btn {
        background: #4caf50;
        margin-top: 8px;
      }
      .total {
        margin: 16px 0;
        text-align: right;
        font-size: 18px;
      }
      .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 20px;
      }
      .save-btn {
        background: #4caf50;
      }
      .cancel-btn {
        background: #757575;
      }
      .error {
        margin-top: 10px;
        color: #b00020;
        font-weight: 500;
      }
      .success {
        margin-top: 10px;
        color: #2e7d32;
        font-weight: 500;
      }
      .info {
        color: #666;
        font-style: italic;
        margin: 8px 0;
      }
    `
  ]
})
export class MechanicWorkOrdersPageComponent {
  appointments = signal<Appointment[]>([]);
  workOrders = signal<WorkOrder[]>([]);
  vehicles = signal<Vehicle[]>([]);
  users = signal<User[]>([]);
  processing = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  showEstimationModal = signal(false);
  selectedWorkOrder = signal<WorkOrder | null>(null);
  currentTasks = signal<WorkOrderTask[]>([]);
  
  estimationNotes: Record<string, string> = {};
  currentEstimationNote = '';

  constructor(
    private appointmentsService: AppointmentsService,
    private workOrdersService: WorkOrdersService,
    private vehiclesService: VehiclesService,
    private usersService: UsersService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      console.log('🔄 Mécanicien - Chargement des données...');
      const [appointments, workOrders, vehicles, users] = await Promise.all([
        this.appointmentsService.list(),
        this.workOrdersService.list(),
        this.vehiclesService.list(),
        this.usersService.list()
      ]);
      
      console.log('📅 Rendez-vous reçus:', appointments);
      console.log('🔧 Work orders reçus:', workOrders);
      console.log('🚗 Véhicules reçus:', vehicles);
      
      this.appointments.set(appointments);
      this.workOrders.set(workOrders);
      this.vehicles.set(vehicles);
      this.users.set(users);
      
      console.log('✅ Données chargées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error);
      this.error.set('Erreur lors du chargement des données');
    }
  }

  // Rendez-vous confirmés assignés au mécanicien connecté sans work order
  appointmentsToEstimate() {
    const existingWorkOrderAppointments = new Set(
      this.workOrders().map(wo => wo.appointmentId)
    );
    
    const filtered = this.appointments().filter(appointment => 
      appointment.status === 'confirmed' && 
      !existingWorkOrderAppointments.has(appointment._id)
    );
    
    console.log('🔍 Filtrage rendez-vous à estimer:');
    console.log('  - Tous les rendez-vous:', this.appointments().length);
    console.log('  - Work orders existants:', this.workOrders().length);
    console.log('  - Rendez-vous confirmés sans work order:', filtered.length);
    console.log('  - Détail:', filtered);
    
    return filtered;
  }

  // Work orders en draft (créés mais pas encore estimés)
  workOrdersToEstimate() {
    return this.workOrders().filter(wo => wo.status === 'draft');
  }

  // Work orders approuvés par le client
  approvedWorkOrders() {
    return this.workOrders().filter(wo => wo.status === 'approved');
  }

  // Work orders en attente ou refusés
  pendingWorkOrders() {
    return this.workOrders().filter(wo => 
      ['pending_client_approval', 'rejected'].includes(wo.status)
    );
  }

  getAppointmentStatus(appointmentId: string): string {
    const appointment = this.appointments().find(a => a._id === appointmentId);
    return appointment ? appointment.status : 'unknown';
  }

  getStatusLabel(status: string): string {
    const labels = {
      'pending_client_approval': 'En attente client',
      'rejected': 'Refusé',
      'approved': 'Approuvé'
    };
    return labels[status as keyof typeof labels] || status;
  }

  getVehicleInfo(vehicleId: string): string {
    const vehicle = this.vehicles().find(v => v._id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plate})` : 'Véhicule inconnu';
  }

  getUserName(userId?: string): string {
    if (!userId) return '';
    const user = this.users().find(u => u.id === userId);
    return user ? user.fullName : 'Utilisateur inconnu';
  }

  async startDiagnostic(appointmentId: string): Promise<void> {
    this.processing.set(true);
    this.error.set(null);
    this.success.set(null);
    
    try {
      // Mettre le rendez-vous en "in_progress"
      await this.appointmentsService.setStatus(appointmentId, 'in_progress', 'Diagnostic en cours');
      
      // Créer un work order
      await this.workOrdersService.create(appointmentId);
      
      this.success.set('Diagnostic commencé, work order créé !');
      await this.refresh();
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors du démarrage du diagnostic');
    } finally {
      this.processing.set(false);
    }
  }

  openEstimationModal(workOrder: WorkOrder): void {
    this.selectedWorkOrder.set(workOrder);
    this.currentEstimationNote = this.estimationNotes[workOrder._id] || '';
    this.currentTasks.set(workOrder.tasks.length > 0 ? [...workOrder.tasks] : [{ label: '', price: 0 }]);
    this.showEstimationModal.set(true);
  }

  closeEstimationModal(): void {
    this.showEstimationModal.set(false);
    this.selectedWorkOrder.set(null);
    this.currentTasks.set([]);
    this.currentEstimationNote = '';
  }

  addTask(): void {
    this.currentTasks.update(tasks => [...tasks, { label: '', price: 0 }]);
  }

  removeTask(index: number): void {
    this.currentTasks.update(tasks => tasks.filter((_, i) => i !== index));
  }

  calculateTotal(): number {
    return this.currentTasks().reduce((sum, task) => sum + (task.price || 0), 0);
  }

  async saveEstimation(): Promise<void> {
    const workOrder = this.selectedWorkOrder();
    if (!workOrder) return;

    this.processing.set(true);
    this.error.set(null);
    
    try {
      const validTasks = this.currentTasks().filter(task => task.label.trim() && task.price > 0);
      
      if (validTasks.length === 0) {
        this.error.set('Ajoutez au moins une tâche avec un prix');
        return;
      }

      await this.workOrdersService.updateEstimation(
        workOrder._id, 
        validTasks, 
        this.currentEstimationNote
      );
      
      this.success.set('Estimation créée et envoyée au manager !');
      this.closeEstimationModal();
      await this.refresh();
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      this.processing.set(false);
    }
  }

  async startRepair(appointmentId: string): Promise<void> {
    this.processing.set(true);
    this.error.set(null);
    
    try {
      await this.appointmentsService.setStatus(appointmentId, 'in_progress', 'Réparation en cours');
      this.success.set('Réparation commencée !');
      await this.refresh();
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors du démarrage de la réparation');
    } finally {
      this.processing.set(false);
    }
  }

  async finishRepair(appointmentId: string): Promise<void> {
    this.processing.set(true);
    this.error.set(null);
    
    try {
      await this.appointmentsService.setStatus(appointmentId, 'done', 'Réparation terminée');
      this.success.set('Réparation terminée avec succès !');
      await this.refresh();
    } catch (error: any) {
      if (error.message?.includes('must be approved')) {
        this.error.set('Impossible de terminer : l\'estimation doit être approuvée par le client');
      } else {
        this.error.set(error.message || 'Erreur lors de la finalisation');
      }
    } finally {
      this.processing.set(false);
    }
  }
}

