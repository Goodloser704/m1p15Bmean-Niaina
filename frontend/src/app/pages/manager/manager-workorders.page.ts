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
        <p *ngIf="estimatedWorkOrders().length === 0" class="info">
          Aucune estimation à réviser.
        </p>
      </div>

      <div class="card">
        <h3>Négociations en cours</h3>
        <table>
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
                <span class="message-count">{{ (w.messages || []).length }} message(s)</span>
              </td>
              <td>
                <button (click)="openNegotiation(w)" class="negotiate-btn">
                  Gérer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="negotiatingWorkOrders().length === 0" class="info">
          Aucune négociation en cours.
        </p>
      </div>

      <div class="card">
        <h3>✅ Réparations Terminées (À Valider)</h3>
        <table>
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
            <tr *ngFor="let w of validatedWorkOrders()">
              <td>{{ w.updatedAt | date:'short' }}</td>
              <td>{{ getClientName(w.appointmentId) }}</td>
              <td>{{ getVehicleInfo(w.appointmentId) }}</td>
              <td>{{ getUserName(w.mechanicId) || 'Non assigné' }}</td>
              <td>{{ w.total }}€</td>
              <td>
                <button (click)="markAsPaid(w._id)" [disabled]="processing()" class="mechanic-btn mechanic-btn-success">
                  💰 Marquer comme Payé
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="validatedWorkOrders().length === 0" class="info">
          Aucune réparation terminée en attente de validation.
        </p>
      </div>

      <div class="card">
        <h3>💰 Réparations Payées</h3>
        <table>
          <thead>
            <tr>
              <th>Date Paiement</th>
              <th>Client</th>
              <th>Véhicule</th>
              <th>Mécanicien</th>
              <th>Total</th>
              <th>Commission</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let w of paidWorkOrders()">
              <td>{{ w.updatedAt | date:'short' }}</td>
              <td>{{ getClientName(w.appointmentId) }}</td>
              <td>{{ getVehicleInfo(w.appointmentId) }}</td>
              <td>{{ getUserName(w.mechanicId) || 'Non assigné' }}</td>
              <td>{{ w.total }}€</td>
              <td>{{ calculateCommission(w) }}€</td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="paidWorkOrders().length === 0" class="info">
          Aucune réparation payée.
        </p>
      </div>
        <table>
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
                <span class="status" [class]="'status-' + w.status">{{ w.status }}</span>
              </td>
              <td>{{ w.appointmentId.substring(0, 8) }}...</td>
              <td>{{ getUserName(w.mechanicId) || 'Non assigné' }}</td>
              <td>{{ (w.tasks || []).length }} tâche(s)</td>
              <td>{{ (w.total || 0) }}€</td>
              <td class="actions">
                <button *ngIf="w.status === 'estimated'" (click)="reviewEstimation(w)">
                  Réviser
                </button>
                <button *ngIf="w.status === 'approved'" (click)="validate(w._id)">
                  Valider
                </button>
                <span *ngIf="w.status === 'pending_client_approval'" class="waiting">
                  ⏳ En attente client
                </span>
                <span *ngIf="w.status === 'rejected'" class="rejected">
                  ❌ Refusé par client
                </span>
                <span *ngIf="w.status === 'validated'" class="validated">
                  ✅ Validé
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="workOrders().length === 0" class="info">
          Aucun ordre de réparation créé.
        </p>
      </div>

      <p class="error" *ngIf="error()">{{ error() }}</p>
      <p class="success" *ngIf="success()">{{ success() }}</p>

      <!-- Modal de révision d'estimation -->
      <div class="modal" *ngIf="showReviewModal()" (click)="closeReviewModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>Révision d'estimation</h3>
          
          <div *ngIf="selectedWorkOrder()">
            <div class="estimation-info">
              <p><strong>Client :</strong> {{ getClientName(selectedWorkOrder()!.appointmentId) }}</p>
              <p><strong>Diagnostic :</strong> {{ selectedWorkOrder()!.estimationNote || 'Aucun diagnostic' }}</p>
            </div>

            <div class="tasks-review">
              <h4>Tâches et prix :</h4>
              <div *ngFor="let task of reviewTasks(); let i = index" class="task-row">
                <input 
                  [(ngModel)]="task.label" 
                  placeholder="Description"
                  class="task-label">
                <input 
                  [(ngModel)]="task.price" 
                  type="number" 
                  placeholder="Prix"
                  class="task-price">
                <button (click)="removeReviewTask(i)" class="remove-btn">×</button>
              </div>
              <button (click)="addReviewTask()" class="add-task-btn">+ Ajouter une tâche</button>
            </div>

            <div class="total-review">
              <strong>Total révisé : {{ calculateReviewTotal() }}€</strong>
            </div>

            <div class="modal-actions">
              <button (click)="sendToClient()" [disabled]="processing()" class="send-btn">
                Envoyer au client
              </button>
              <button (click)="closeReviewModal()" class="cancel-btn">
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de négociation -->
      <div class="modal" *ngIf="showNegotiationModal()" (click)="closeNegotiationModal()">
        <div class="modal-content negotiation-modal" (click)="$event.stopPropagation()">
          <h3>Négociation avec le client</h3>
          
          <div *ngIf="selectedWorkOrder()">
            <div class="client-info">
              <p><strong>Client :</strong> {{ getClientName(selectedWorkOrder()!.appointmentId) }}</p>
              <p><strong>Total actuel :</strong> {{ selectedWorkOrder()!.total }}€</p>
            </div>

            <!-- Messages de négociation -->
            <div class="messages-section">
              <h4>Conversation :</h4>
              <div class="messages" #messagesContainer>
                <div *ngFor="let msg of selectedWorkOrder()!.messages || []" 
                     class="message" 
                     [class]="'message-' + msg.sender">
                  <div class="message-header">
                    <span class="sender">{{ getSenderName(msg.sender) }}</span>
                    <span class="date">{{ msg.createdAt | date:'short' }}</span>
                  </div>
                  <div class="message-content">{{ msg.message }}</div>
                </div>
              </div>
            </div>

            <!-- Réponse manager -->
            <div class="response-section">
              <textarea 
                [(ngModel)]="managerMessage" 
                placeholder="Votre réponse au client..."
                rows="3">
              </textarea>
              <button (click)="sendManagerMessage()" [disabled]="processing()" class="message-btn">
                Envoyer message
              </button>
            </div>

            <!-- Ajustement des prix -->
            <div class="price-adjustment">
              <h4>Ajuster les prix :</h4>
              <div *ngFor="let task of negotiationTasks(); let i = index" class="task-row">
                <span class="task-label">{{ task.label }}</span>
                <input 
                  [(ngModel)]="task.price" 
                  type="number" 
                  class="task-price">
              </div>
              <div class="total-adjustment">
                <strong>Nouveau total : {{ calculateNegotiationTotal() }}€</strong>
              </div>
              <button (click)="updatePrices()" [disabled]="processing()" class="update-btn">
                Mettre à jour les prix
              </button>
            </div>

            <div class="modal-actions">
              <button (click)="closeNegotiationModal()" class="close-btn">
                Fermer
              </button>
            </div>
          </div>
        </div>
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
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
      }
      th,
      td {
        text-align: left;
        padding: 8px;
        border-bottom: 1px solid #eee;
        font-size: 14px;
      }
      th {
        background: #f5f5f5;
        font-weight: 600;
      }
      .actions {
        min-width: 120px;
      }
      .status {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      }
      .status-draft {
        background: #fff3cd;
        color: #856404;
      }
      .status-validated {
        background: #d4edda;
        color: #155724;
      }
      .status-estimated {
        background: #e1f5fe;
        color: #01579b;
      }
      .status-pending_client_approval {
        background: #fff3e0;
        color: #e65100;
      }
      .status-approved {
        background: #e8f5e8;
        color: #2e7d32;
      }
      .status-rejected {
        background: #ffebee;
        color: #c62828;
      }
      .waiting {
        color: #ff9800;
        font-style: italic;
        font-size: 12px;
      }
      .rejected {
        color: #f44336;
        font-style: italic;
        font-size: 12px;
      }
      .validated {
        color: #4caf50;
        font-style: italic;
        font-size: 12px;
      }
      .review-btn {
        background: #ff9800;
      }
      .negotiate-btn {
        background: #2196f3;
      }
      .message-count {
        background: #e3f2fd;
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 11px;
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
      .negotiation-modal {
        max-width: 800px;
      }
      .estimation-info,
      .client-info {
        background: #f8f9fa;
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 16px;
      }
      .tasks-review,
      .price-adjustment {
        margin: 16px 0;
      }
      .task-row {
        display: grid;
        grid-template-columns: 2fr 1fr auto;
        gap: 8px;
        margin-bottom: 8px;
        align-items: center;
      }
      .task-label,
      .task-price {
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
      .total-review,
      .total-adjustment {
        margin: 16px 0;
        text-align: right;
        font-size: 18px;
      }
      .messages-section {
        margin: 16px 0;
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #eee;
        border-radius: 4px;
        padding: 12px;
      }
      .message {
        margin: 8px 0;
        padding: 8px;
        border-radius: 4px;
      }
      .message-client {
        background: #e3f2fd;
        margin-left: 20px;
      }
      .message-manager {
        background: #fff3e0;
        margin-right: 20px;
      }
      .message-header {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #666;
        margin-bottom: 4px;
      }
      .response-section {
        margin: 16px 0;
      }
      .response-section textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        resize: vertical;
        margin-bottom: 8px;
      }
      .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 20px;
      }
      .send-btn {
        background: #4caf50;
      }
      .update-btn {
        background: #2196f3;
      }
      .message-btn {
        background: #ff9800;
      }
      .cancel-btn,
      .close-btn {
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
      .debug {
        display: block;
        font-size: 10px;
        color: #999;
        margin-top: 2px;
      }
    `
  ]
})
export class ManagerWorkOrdersPageComponent {
  workOrders = signal<WorkOrder[]>([]);
  appointments = signal<Appointment[]>([]);
  users = signal<User[]>([]);
  vehicles = signal<Vehicle[]>([]);
  creating = signal(false);
  processing = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  showReviewModal = signal(false);
  showNegotiationModal = signal(false);
  selectedWorkOrder = signal<WorkOrder | null>(null);
  reviewTasks = signal<WorkOrderTask[]>([]);
  negotiationTasks = signal<WorkOrderTask[]>([]);
  
  managerMessage = '';

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

  // Rendez-vous confirmés qui n'ont pas encore d'ordre de réparation
  availableAppointments() {
    const existingWorkOrderAppointments = new Set(
      this.workOrders().map(wo => wo.appointmentId)
    );
    
    return this.appointments().filter(appointment => 
      appointment.status === 'confirmed' && 
      !existingWorkOrderAppointments.has(appointment._id)
    );
  }

  // Work orders avec estimations à réviser
  estimatedWorkOrders() {
    return this.workOrders().filter(wo => wo.status === 'estimated');
  }

  // Work orders en négociation avec le client
  negotiatingWorkOrders() {
    return this.workOrders().filter(wo => wo.status === 'pending_client_approval');
  }

  // Work orders terminés en attente de validation de paiement
  validatedWorkOrders() {
    return this.workOrders().filter(wo => wo.status === 'validated');
  }

  // Work orders payés
  paidWorkOrders() {
    return this.workOrders().filter(wo => wo.status === 'paid');
  }

  getUserName(userId?: string): string {
    if (!userId) return '';
    const user = this.users().find(u => u.id === userId);
    return user ? user.fullName : 'Utilisateur inconnu';
  }

  getVehicleInfoById(vehicleId: string): string {
    const vehicle = this.vehicles().find(v => v._id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plate})` : 'Véhicule inconnu';
  }

  getClientName(appointmentId: string): string {
    const appointment = this.appointments().find(a => a._id === appointmentId);
    return appointment ? this.getUserName(appointment.clientId) : 'Client inconnu';
  }

  getVehicleInfo(appointmentId: string): string {
    const appointment = this.appointments().find(a => a._id === appointmentId);
    if (!appointment) return 'Véhicule inconnu';
    return this.getVehicleInfoById(appointment.vehicleId);
  }

  getSenderName(sender: string): string {
    const names = {
      'client': 'Client',
      'manager': 'Manager',
      'mechanic': 'Mécanicien'
    };
    return names[sender as keyof typeof names] || sender;
  }

  trackByAppointmentId(index: number, appointment: Appointment): string {
    return appointment._id;
  }

  async createForAppointment(appointmentId: string): Promise<void> {
    // Validation de l'appointmentId
    if (!appointmentId || appointmentId.length !== 24) {
      this.error.set('ID de rendez-vous invalide');
      return;
    }

    this.creating.set(true);
    this.error.set(null);
    this.success.set(null);
    try {
      console.log('🔄 Creating work order for appointment:', appointmentId);
      await this.workOrdersService.create(appointmentId);
      this.success.set('Ordre de réparation créé avec succès !');
      await this.refresh();
    } catch (error: any) {
      console.error('❌ Error creating work order:', error);
      
      // Gestion spécifique des erreurs
      if (error.status === 400) {
        this.error.set('Données invalides. Vérifiez le rendez-vous sélectionné.');
      } else if (error.status === 404) {
        this.error.set('Rendez-vous non trouvé.');
      } else if (error.status === 409) {
        this.error.set('Un ordre de réparation existe déjà pour ce rendez-vous.');
      } else {
        this.error.set(error.message || "Création impossible");
      }
    } finally {
      this.creating.set(false);
    }
  }

  async validate(id: string): Promise<void> {
    this.error.set(null);
    this.success.set(null);
    try {
      await this.workOrdersService.validate(id);
      this.success.set('Ordre de réparation validé avec succès !');
      await this.refresh();
    } catch (error: any) {
      this.error.set(error.message || 'Validation impossible');
    }
  }

  async markAsPaid(id: string): Promise<void> {
    this.processing.set(true);
    this.error.set(null);
    this.success.set(null);
    try {
      await this.workOrdersService.markAsPaid(id);
      this.success.set('Réparation marquée comme payée ! Les commissions du mécanicien sont maintenant calculées.');
      await this.refresh();
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors du marquage comme payé');
    } finally {
      this.processing.set(false);
    }
  }

  calculateCommission(workOrder: WorkOrder): number {
    const mechanic = this.users().find(u => u.id === workOrder.mechanicId);
    if (!mechanic || !mechanic.commissionRate) return 0;
    
    const commission = (workOrder.total || 0) * (mechanic.commissionRate / 100);
    return Math.round(commission * 100) / 100;
  }

  async reviewEstimation(workOrder: WorkOrder): Promise<void> {
    this.selectedWorkOrder.set(workOrder);
    this.reviewTasks.set([...workOrder.tasks]);
    this.showReviewModal.set(true);
  }

  closeReviewModal(): void {
    this.showReviewModal.set(false);
    this.selectedWorkOrder.set(null);
    this.reviewTasks.set([]);
  }

  addReviewTask(): void {
    this.reviewTasks.update(tasks => [...tasks, { label: '', price: 0 }]);
  }

  removeReviewTask(index: number): void {
    this.reviewTasks.update(tasks => tasks.filter((_, i) => i !== index));
  }

  calculateReviewTotal(): number {
    return this.reviewTasks().reduce((sum, task) => sum + (task.price || 0), 0);
  }

  async sendToClient(): Promise<void> {
    const workOrder = this.selectedWorkOrder();
    if (!workOrder) return;

    this.processing.set(true);
    this.error.set(null);
    
    try {
      const validTasks = this.reviewTasks().filter(task => task.label.trim() && task.price > 0);
      
      await this.workOrdersService.managerReview(workOrder._id, validTasks, 'send_to_client');
      this.success.set('Estimation envoyée au client pour approbation !');
      this.closeReviewModal();
      await this.refresh();
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors de l\'envoi');
    } finally {
      this.processing.set(false);
    }
  }

  openNegotiation(workOrder: WorkOrder): void {
    this.selectedWorkOrder.set(workOrder);
    this.negotiationTasks.set([...workOrder.tasks]);
    this.showNegotiationModal.set(true);
  }

  closeNegotiationModal(): void {
    this.showNegotiationModal.set(false);
    this.selectedWorkOrder.set(null);
    this.negotiationTasks.set([]);
    this.managerMessage = '';
  }

  calculateNegotiationTotal(): number {
    return this.negotiationTasks().reduce((sum, task) => sum + (task.price || 0), 0);
  }

  async sendManagerMessage(): Promise<void> {
    const workOrder = this.selectedWorkOrder();
    if (!workOrder || !this.managerMessage.trim()) return;

    this.processing.set(true);
    this.error.set(null);
    
    try {
      await this.workOrdersService.addMessage(workOrder._id, this.managerMessage);
      this.managerMessage = '';
      this.success.set('Message envoyé !');
      await this.refresh();
      // Recharger le work order sélectionné
      const updatedWorkOrder = this.workOrders().find(w => w._id === workOrder._id);
      if (updatedWorkOrder) {
        this.selectedWorkOrder.set(updatedWorkOrder);
      }
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors de l\'envoi du message');
    } finally {
      this.processing.set(false);
    }
  }

  async updatePrices(): Promise<void> {
    const workOrder = this.selectedWorkOrder();
    if (!workOrder) return;

    this.processing.set(true);
    this.error.set(null);
    
    try {
      const validTasks = this.negotiationTasks().filter(task => task.label.trim() && task.price > 0);
      
      await this.workOrdersService.managerReview(workOrder._id, validTasks, 'send_to_client');
      this.success.set('Prix mis à jour et renvoyé au client !');
      await this.refresh();
      // Recharger le work order sélectionné
      const updatedWorkOrder = this.workOrders().find(w => w._id === workOrder._id);
      if (updatedWorkOrder) {
        this.selectedWorkOrder.set(updatedWorkOrder);
        this.negotiationTasks.set([...updatedWorkOrder.tasks]);
      }
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors de la mise à jour');
    } finally {
      this.processing.set(false);
    }
  }
}

