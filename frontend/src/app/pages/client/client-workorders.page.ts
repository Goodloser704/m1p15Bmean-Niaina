import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkOrdersService } from '../../core/services/workorders.service';
import { AppointmentsService } from '../../core/services/appointments.service';
import type { WorkOrder, Appointment, WorkOrderMessage } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-client-workorders-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-mechanic-theme">
      <div class="wrap">
      <h2>Mes estimations et réparations</h2>

      <!-- Estimations en attente d'approbation -->
      <div class="card" *ngFor="let wo of pendingWorkOrders()">
        <h3>Estimation pour votre véhicule</h3>
        
        <div class="estimation-details">
          <div class="info-row">
            <strong>Rendez-vous :</strong> {{ getAppointmentInfo(wo.appointmentId) }}
          </div>
          <div class="info-row" *ngIf="wo.estimationNote">
            <strong>Diagnostic :</strong> {{ wo.estimationNote }}
          </div>
        </div>

        <div class="tasks-section">
          <h4>Détail des réparations :</h4>
          <table class="tasks-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Prix</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let task of wo.tasks">
                <td>{{ task.label }}</td>
                <td>{{ task.price }}€</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td><strong>Total</strong></td>
                <td><strong>{{ wo.total }}€</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Messages de négociation -->
        <div class="messages-section" *ngIf="wo.messages && wo.messages.length > 0">
          <h4>Discussion :</h4>
          <div class="messages">
            <div *ngFor="let msg of wo.messages" 
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

        <!-- Zone de réponse -->
        <div class="response-section">
          <textarea 
            [(ngModel)]="clientMessages[wo._id]" 
            placeholder="Votre message ou question sur l'estimation..."
            rows="3">
          </textarea>
          <div class="response-actions">
            <button (click)="sendMessage(wo._id)" [disabled]="processing()" class="message-btn">
              Envoyer message
            </button>
          </div>
        </div>

        <!-- Actions d'approbation -->
        <div class="approval-section">
          <textarea 
            [(ngModel)]="clientNotes[wo._id]" 
            placeholder="Note optionnelle sur votre décision..."
            rows="2">
          </textarea>
          <div class="approval-actions">
            <button (click)="approveEstimation(wo._id, true)" 
                    [disabled]="processing()" 
                    class="approve-btn">
              ✓ Approuver l'estimation
            </button>
            <button (click)="approveEstimation(wo._id, false)" 
                    [disabled]="processing()" 
                    class="reject-btn">
              ✗ Refuser l'estimation
            </button>
          </div>
        </div>
      </div>

      <!-- Historique des estimations -->
      <div class="card">
        <h3>Historique de mes réparations</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Véhicule</th>
              <th>Statut</th>
              <th>Total</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let wo of completedWorkOrders()">
              <td>{{ wo.createdAt | date:'short' }}</td>
              <td>{{ getAppointmentInfo(wo.appointmentId) }}</td>
              <td>
                <span class="status" [class]="'status-' + wo.status">
                  {{ getStatusLabel(wo.status) }}
                </span>
              </td>
              <td>{{ wo.total }}€</td>
              <td>
                <button (click)="viewDetails(wo)" class="details-btn">
                  Voir détails
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="completedWorkOrders().length === 0" class="info">
          Aucun historique de réparation.
        </p>
      </div>

      <!-- Modal de détails -->
      <div class="modal" *ngIf="showDetailsModal()" (click)="closeDetailsModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>Détails de la réparation</h3>
          <div *ngIf="selectedWorkOrder()">
            <div class="detail-section">
              <h4>Tâches effectuées :</h4>
              <ul>
                <li *ngFor="let task of selectedWorkOrder()!.tasks">
                  {{ task.label }} - {{ task.price }}€
                </li>
              </ul>
              <p><strong>Total : {{ selectedWorkOrder()!.total }}€</strong></p>
            </div>
            
            <div class="detail-section" *ngIf="selectedWorkOrder()!.estimationNote">
              <h4>Diagnostic :</h4>
              <p>{{ selectedWorkOrder()!.estimationNote }}</p>
            </div>
            
            <div class="detail-section" *ngIf="selectedWorkOrder()!.clientNote">
              <h4>Votre note :</h4>
              <p>{{ selectedWorkOrder()!.clientNote }}</p>
            </div>
          </div>
          <button (click)="closeDetailsModal()" class="close-btn">Fermer</button>
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
        max-width: 1000px;
        margin: 16px auto;
        padding: 0 12px;
      }
      .card {
        margin-top: 16px;
        padding: 20px;
        border: 1px solid #e3e3e3;
        border-radius: 10px;
        background: #fff;
      }
      .card h3 {
        margin-top: 0;
        color: #333;
        border-bottom: 2px solid #0b57d0;
        padding-bottom: 8px;
      }
      .estimation-details {
        margin: 16px 0;
      }
      .info-row {
        margin: 8px 0;
        padding: 8px;
        background: #f8f9fa;
        border-radius: 4px;
      }
      .tasks-section {
        margin: 20px 0;
      }
      .tasks-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
      }
      .tasks-table th,
      .tasks-table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #eee;
      }
      .tasks-table th {
        background: #f5f5f5;
        font-weight: 600;
      }
      .total-row {
        background: #e3f2fd;
        font-size: 16px;
      }
      .messages-section {
        margin: 20px 0;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
      }
      .messages {
        max-height: 300px;
        overflow-y: auto;
      }
      .message {
        margin: 12px 0;
        padding: 12px;
        border-radius: 8px;
      }
      .message-client {
        background: #e3f2fd;
        margin-left: 20px;
      }
      .message-manager {
        background: #fff3e0;
        margin-right: 20px;
      }
      .message-mechanic {
        background: #e8f5e8;
        margin-right: 20px;
      }
      .message-header {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
      }
      .sender {
        font-weight: 600;
      }
      .response-section,
      .approval-section {
        margin: 20px 0;
        padding: 16px;
        border: 1px solid #ddd;
        border-radius: 8px;
      }
      .response-actions,
      .approval-actions {
        margin-top: 12px;
        display: flex;
        gap: 12px;
      }
      textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        resize: vertical;
        font-family: inherit;
      }
      button {
        padding: 10px 16px;
        border-radius: 8px;
        border: 0;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      }
      .approve-btn {
        background: #4caf50;
        color: white;
      }
      .reject-btn {
        background: #f44336;
        color: white;
      }
      .message-btn {
        background: #2196f3;
        color: white;
      }
      .details-btn {
        background: #ff9800;
        color: white;
        font-size: 12px;
        padding: 6px 12px;
      }
      .close-btn {
        background: #757575;
        color: white;
      }
      button:disabled {
        background: #ccc;
        cursor: not-allowed;
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
      .status-rejected {
        background: #ffebee;
        color: #c62828;
      }
      .status-validated {
        background: #d4edda;
        color: #155724;
      }
      .status-paid {
        background: #d1ecf1;
        color: #0c5460;
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
      .detail-section {
        margin: 16px 0;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 4px;
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
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
      }
      table th,
      table td {
        text-align: left;
        padding: 8px;
        border-bottom: 1px solid #eee;
        font-size: 14px;
      }
      table th {
        background: #f5f5f5;
        font-weight: 600;
      }
    `
  ]
})
export class ClientWorkOrdersPageComponent {
  workOrders = signal<WorkOrder[]>([]);
  appointments = signal<Appointment[]>([]);
  processing = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  showDetailsModal = signal(false);
  selectedWorkOrder = signal<WorkOrder | null>(null);
  
  clientMessages: Record<string, string> = {};
  clientNotes: Record<string, string> = {};

  constructor(
    private workOrdersService: WorkOrdersService,
    private appointmentsService: AppointmentsService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      const [workOrders, appointments] = await Promise.all([
        this.workOrdersService.list(),
        this.appointmentsService.list()
      ]);
      
      this.workOrders.set(workOrders);
      this.appointments.set(appointments);
    } catch (error) {
      this.error.set('Erreur lors du chargement des données');
    }
  }

  pendingWorkOrders() {
    return this.workOrders().filter(wo => wo.status === 'pending_client_approval');
  }

  completedWorkOrders() {
    return this.workOrders().filter(wo => 
      ['approved', 'rejected', 'validated', 'paid'].includes(wo.status)
    );
  }

  getAppointmentInfo(appointmentId: string): string {
    const appointment = this.appointments().find(a => a._id === appointmentId);
    return appointment ? 
      `${appointment.scheduledAt ? new Date(appointment.scheduledAt).toLocaleDateString() : 'Date non définie'}` :
      'Rendez-vous inconnu';
  }

  getSenderName(sender: string): string {
    const names = {
      'client': 'Vous',
      'manager': 'Manager',
      'mechanic': 'Mécanicien'
    };
    return names[sender as keyof typeof names] || sender;
  }

  getStatusLabel(status: string): string {
    const labels = {
      'approved': 'Approuvé',
      'rejected': 'Refusé',
      'validated': 'Validé',
      'paid': 'Payé'
    };
    return labels[status as keyof typeof labels] || status;
  }

  async sendMessage(workOrderId: string): Promise<void> {
    const message = this.clientMessages[workOrderId]?.trim();
    if (!message) return;

    this.processing.set(true);
    this.error.set(null);
    
    try {
      await this.workOrdersService.addMessage(workOrderId, message);
      this.clientMessages[workOrderId] = '';
      this.success.set('Message envoyé !');
      await this.refresh();
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors de l\'envoi du message');
    } finally {
      this.processing.set(false);
    }
  }

  async approveEstimation(workOrderId: string, approved: boolean): Promise<void> {
    this.processing.set(true);
    this.error.set(null);
    
    try {
      await this.workOrdersService.clientDecision(
        workOrderId, 
        approved, 
        this.clientNotes[workOrderId] || ''
      );
      
      this.success.set(approved ? 
        'Estimation approuvée ! Le mécanicien peut commencer les réparations.' :
        'Estimation refusée. Le garage va vous recontacter.'
      );
      
      await this.refresh();
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors de la décision');
    } finally {
      this.processing.set(false);
    }
  }

  viewDetails(workOrder: WorkOrder): void {
    this.selectedWorkOrder.set(workOrder);
    this.showDetailsModal.set(true);
  }

  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.selectedWorkOrder.set(null);
  }
}