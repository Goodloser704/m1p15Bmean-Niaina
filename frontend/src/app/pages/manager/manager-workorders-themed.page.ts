import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkOrdersService } from '../../core/services/workorders.service';
import { AppointmentsService } from '../../core/services/appointments.service';
import { UsersService } from '../../core/services/users.service';
import { VehiclesService } from '../../core/services/vehicles.service';
import type { WorkOrder, Appointment, User, Vehicle, WorkOrderTask } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-manager-workorders-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mechanic-theme">
      <div class="mechanic-wrap">
        <div class="mechanic-banner">
          👔 Interface Manager - Supervision des Réparations 👔
        </div>
        
        <h2 class="mechanic-title">📋 Gestion des Ordres de Réparation</h2>

        <div class="mechanic-card">
          <h3>🔍 Estimations à Réviser</h3>
          <table class="mechanic-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Véhicule</th>
                <th>Mécanicien</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let w of estimatedWorkOrders()">
                <td>{{ w.createdAt | date : 'short' }}</td>
                <td>{{ getClientName(w.appointmentId) }}</td>
                <td>{{ getVehicleInfo(w.appointmentId) }}</td>
                <td>{{ getUserName(w.mechanicId) || 'Non assigné' }}</td>
                <td>{{ w.total }}€</td>
                <td>
                  <button (click)="reviewEstimation(w)" class="mechanic-btn mechanic-btn-info">
                    👁️ Réviser
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="estimatedWorkOrders().length === 0" class="mechanic-alert mechanic-alert-info">
            Aucune estimation à réviser.
          </p>
        </div>

        <div class="mechanic-card">
          <h3>💬 Négociations en Cours</h3>
          <table class="mechanic-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Véhicule</th>
                <th>Total</th>
                <th>Messages</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let w of negotiatingWorkOrders()">
                <td>{{ getClientName(w.appointmentId) }}</td>
                <td>{{ getVehicleInfo(w.appointmentId) }}</td>
                <td>{{ w.total }}€</td>
                <td>
                  <span class="mechanic-status mechanic-status-info">{{ (w.messages || []).length }} message(s)</span>
                </td>
                <td>
                  <button (click)="openNegotiation(w)" class="mechanic-btn mechanic-btn-warning">
                    💬 Gérer
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="negotiatingWorkOrders().length === 0" class="mechanic-alert mechanic-alert-info">
            Aucune négociation en cours.
          </p>
        </div>

        <div class="mechanic-card">
          <h3>📊 Tous les Ordres de Réparation</h3>
          <table class="mechanic-table">
            <thead>
              <tr>
                <th>Statut</th>
                <th>Rendez-vous</th>
                <th>Mécanicien</th>
                <th>Tâches</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let w of workOrders()">
                <td>
                  <span class="mechanic-status" [ngClass]="getStatusClass(w.status)">{{ getStatusLabel(w.status) }}</span>
                </td>
                <td>{{ w.appointmentId.substring(0, 8) }}...</td>
                <td>{{ getUserName(w.mechanicId) || 'Non assigné' }}</td>
                <td>{{ (w.tasks || []).length }} tâche(s)</td>
                <td>{{ (w.total || 0) }}€</td>
                <td class="actions">
                  <button *ngIf="w.status === 'estimated'" (click)="reviewEstimation(w)" class="mechanic-btn mechanic-btn-info">
                    👁️ Réviser
                  </button>
                  <button *ngIf="w.status === 'approved'" (click)="validate(w._id)" class="mechanic-btn mechanic-btn-success">
                    ✅ Valider
                  </button>
                  <span *ngIf="w.status === 'pending_client_approval'" class="mechanic-status mechanic-status-warning">
                    ⏳ En attente client
                  </span>
                  <span *ngIf="w.status === 'rejected'" class="mechanic-status mechanic-status-danger">
                    ❌ Refusé par client
                  </span>
                  <span *ngIf="w.status === 'validated'" class="mechanic-status mechanic-status-success">
                    ✅ Validé
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="workOrders().length === 0" class="mechanic-alert mechanic-alert-info">
            Aucun ordre de réparation créé.
          </p>
        </div>

        <p class="mechanic-alert mechanic-alert-error" *ngIf="error()">{{ error() }}</p>
        <p class="mechanic-alert mechanic-alert-success" *ngIf="success()">{{ success() }}</p>

        <!-- Modal de révision d'estimation -->
        <div class="mechanic-modal" *ngIf="showReviewModal()" (click)="closeReviewModal()">
          <div class="mechanic-modal-content" (click)="$event.stopPropagation()">
            <h3>🔍 Révision d'Estimation</h3>
            
            <div *ngIf="selectedWorkOrder()">
              <div class="estimation-info">
                <p><strong>Client :</strong> {{ getClientName(selectedWorkOrder()!.appointmentId) }}</p>
                <p><strong>Diagnostic :</strong> {{ selectedWorkOrder()!.estimationNote || 'Aucun diagnostic' }}</p>
              </div>

              <div class="tasks-review">
                <h4>Tâches et prix :</h4>
                <div *ngFor="let task of currentTasks(); let i = index" class="task-review-row">
                  <input 
                    [(ngModel)]="task.label" 
                    placeholder="Description de la tâche"
                    class="mechanic-input task-label">
                  <input 
                    [(ngModel)]="task.price" 
                    type="number" 
                    placeholder="Prix"
                    class="mechanic-input task-price">
                  <button (click)="removeTask(i)" class="mechanic-btn mechanic-btn-danger remove-btn">×</button>
                </div>
                <button (click)="addTask()" class="mechanic-btn mechanic-btn-success add-task-btn">➕ Ajouter une tâche</button>
              </div>

              <div class="total-section">
                <strong>Total : {{ calculateTotal() }}€</strong>
              </div>

              <div class="modal-actions">
                <button (click)="approveEstimation()" [disabled]="processing()" class="mechanic-btn mechanic-btn-success">
                  ✅ Approuver et envoyer au client
                </button>
                <button (click)="saveChanges()" [disabled]="processing()" class="mechanic-btn mechanic-btn-warning">
                  💾 Sauvegarder les modifications
                </button>
                <button (click)="closeReviewModal()" class="mechanic-btn">
                  ❌ Annuler
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal de négociation -->
        <div class="mechanic-modal" *ngIf="showNegotiationModal()" (click)="closeNegotiationModal()">
          <div class="mechanic-modal-content" (click)="$event.stopPropagation()">
            <h3>💬 Négociation avec le Client</h3>
            
            <div *ngIf="selectedWorkOrder()">
              <div class="messages-list">
                <div *ngFor="let msg of selectedWorkOrder()!.messages || []" class="message" [ngClass]="'message-' + msg.sender">
                  <strong>{{ getSenderLabel(msg.sender) }} :</strong>
                  <p>{{ msg.message }}</p>
                  <small>{{ msg.createdAt | date:'short' }}</small>
                </div>
              </div>
              
              <div class="new-message">
                <label>Nouveau message :</label>
                <textarea 
                  [(ngModel)]="newMessage" 
                  placeholder="Tapez votre message..."
                  class="mechanic-textarea">
                </textarea>
                <button (click)="sendMessage()" [disabled]="!newMessage.trim() || processing()" class="mechanic-btn mechanic-btn-info">
                  📤 Envoyer
                </button>
              </div>

              <div class="modal-actions">
                <button (click)="closeNegotiationModal()" class="mechanic-btn">
                  ❌ Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .estimation-info {
        background: rgba(44, 62, 80, 0.5);
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 20px;
      }
      
      .tasks-review {
        margin: 20px 0;
      }
      
      .task-review-row {
        display: grid;
        grid-template-columns: 2fr 1fr auto;
        gap: 12px;
        margin-bottom: 12px;
        align-items: center;
      }
      
      .task-label, .task-price {
        padding: 8px;
      }
      
      .remove-btn {
        width: 36px;
        height: 36px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .add-task-btn {
        width: 100%;
        margin-top: 12px;
      }
      
      .total-section {
        margin: 20px 0;
        text-align: right;
        font-size: 18px;
        font-weight: 700;
        color: var(--mechanic-secondary);
      }
      
      .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 24px;
        flex-wrap: wrap;
      }
      
      .actions {
        white-space: nowrap;
      }
      
      .messages-list {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #34495e;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 16px;
        background: rgba(44, 62, 80, 0.3);
      }
      
      .message {
        margin-bottom: 12px;
        padding: 8px;
        border-radius: 6px;
      }
      
      .message-client {
        background: rgba(52, 152, 219, 0.2);
        border-left: 3px solid #3498db;
      }
      
      .message-manager {
        background: rgba(230, 126, 34, 0.2);
        border-left: 3px solid #e67e22;
      }
      
      .message p {
        margin: 4px 0;
      }
      
      .message small {
        opacity: 0.7;
        font-size: 11px;
      }
      
      .new-message {
        margin-top: 16px;
      }
      
      .new-message label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: var(--mechanic-light);
      }
      
      .new-message button {
        margin-top: 8px;
        width: 100%;
      }
    `
  ]
})
export class ManagerWorkOrdersPageComponent {
  // ... (le reste du code TypeScript reste identique)
  // Je vais juste ajouter les méthodes de base pour que ça compile
  
  workOrders = signal<WorkOrder[]>([]);
  appointments = signal<Appointment[]>([]);
  users = signal<User[]>([]);
  vehicles = signal<Vehicle[]>([]);
  processing = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  showReviewModal = signal(false);
  showNegotiationModal = signal(false);
  selectedWorkOrder = signal<WorkOrder | null>(null);
  currentTasks = signal<WorkOrderTask[]>([]);
  newMessage = '';

  constructor(
    private workOrdersService: WorkOrdersService,
    private appointmentsService: AppointmentsService,
    private usersService: UsersService,
    private vehiclesService: VehiclesService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      const [workOrders, appointments, users, vehicles] = await Promise.all([
        this.workOrdersService.list(),
        this.appointmentsService.list(),
        this.usersService.list(),
        this.vehiclesService.list()
      ]);
      
      this.workOrders.set(workOrders);
      this.appointments.set(appointments);
      this.users.set(users);
      this.vehicles.set(vehicles);
    } catch (error) {
      this.error.set('Erreur lors du chargement des données');
    }
  }

  estimatedWorkOrders() {
    return this.workOrders().filter(wo => wo.status === 'estimated');
  }

  negotiatingWorkOrders() {
    return this.workOrders().filter(wo => wo.status === 'pending_client_approval');
  }

  getClientName(appointmentId: string): string {
    const appointment = this.appointments().find(a => a._id === appointmentId);
    if (!appointment) return 'Client inconnu';
    const client = this.users().find(u => u.id === appointment.clientId);
    return client ? client.fullName : 'Client inconnu';
  }

  getVehicleInfo(appointmentId: string): string {
    const appointment = this.appointments().find(a => a._id === appointmentId);
    if (!appointment) return 'Véhicule inconnu';
    const vehicle = this.vehicles().find(v => v._id === appointment.vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plate})` : 'Véhicule inconnu';
  }

  getUserName(userId?: string): string {
    if (!userId) return '';
    const user = this.users().find(u => u.id === userId);
    return user ? user.fullName : 'Utilisateur inconnu';
  }

  getStatusClass(status: string): string {
    const classes = {
      'draft': 'mechanic-status-info',
      'estimated': 'mechanic-status-warning',
      'pending_client_approval': 'mechanic-status-warning',
      'approved': 'mechanic-status-success',
      'rejected': 'mechanic-status-danger',
      'validated': 'mechanic-status-success'
    };
    return classes[status as keyof typeof classes] || 'mechanic-status-info';
  }

  getStatusLabel(status: string): string {
    const labels = {
      'draft': 'Brouillon',
      'estimated': 'Estimé',
      'pending_client_approval': 'En attente client',
      'approved': 'Approuvé',
      'rejected': 'Refusé',
      'validated': 'Validé'
    };
    return labels[status as keyof typeof labels] || status;
  }

  getSenderLabel(sender: string): string {
    const labels = {
      'client': 'Client',
      'manager': 'Manager',
      'mechanic': 'Mécanicien'
    };
    return labels[sender as keyof typeof labels] || sender;
  }

  reviewEstimation(workOrder: WorkOrder): void {
    this.selectedWorkOrder.set(workOrder);
    this.currentTasks.set([...workOrder.tasks]);
    this.showReviewModal.set(true);
  }

  openNegotiation(workOrder: WorkOrder): void {
    this.selectedWorkOrder.set(workOrder);
    this.showNegotiationModal.set(true);
  }

  closeReviewModal(): void {
    this.showReviewModal.set(false);
    this.selectedWorkOrder.set(null);
    this.currentTasks.set([]);
  }

  closeNegotiationModal(): void {
    this.showNegotiationModal.set(false);
    this.selectedWorkOrder.set(null);
    this.newMessage = '';
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

  async approveEstimation(): Promise<void> {
    const workOrder = this.selectedWorkOrder();
    if (!workOrder) return;

    this.processing.set(true);
    try {
      await this.workOrdersService.approveEstimation(workOrder._id, this.currentTasks());
      this.success.set('Estimation approuvée et envoyée au client !');
      this.closeReviewModal();
      await this.refresh();
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors de l\'approbation');
    } finally {
      this.processing.set(false);
    }
  }

  async saveChanges(): Promise<void> {
    const workOrder = this.selectedWorkOrder();
    if (!workOrder) return;

    this.processing.set(true);
    try {
      await this.workOrdersService.updateEstimation(workOrder._id, this.currentTasks(), workOrder.estimationNote || '');
      this.success.set('Modifications sauvegardées !');
      await this.refresh();
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      this.processing.set(false);
    }
  }

  async sendMessage(): Promise<void> {
    const workOrder = this.selectedWorkOrder();
    if (!workOrder || !this.newMessage.trim()) return;

    this.processing.set(true);
    try {
      await this.workOrdersService.sendMessage(workOrder._id, this.newMessage.trim());
      this.success.set('Message envoyé !');
      this.newMessage = '';
      await this.refresh();
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors de l\'envoi');
    } finally {
      this.processing.set(false);
    }
  }

  async validate(workOrderId: string): Promise<void> {
    this.processing.set(true);
    try {
      await this.workOrdersService.validate(workOrderId);
      this.success.set('Ordre de réparation validé !');
      await this.refresh();
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors de la validation');
    } finally {
      this.processing.set(false);
    }
  }
}