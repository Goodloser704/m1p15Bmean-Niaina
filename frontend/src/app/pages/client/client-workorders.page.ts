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
      /* Styles simplifiés compatibles avec le thème mécanicien */
      .wrap {
        max-width: 1000px;
        margin: 16px auto;
        padding: 0 12px;
      }
      
      .estimation-details {
        margin: 16px 0;
      }
      
      .info-row {
        margin: 8px 0;
        padding: 12px;
        background: rgba(52, 73, 94, 0.8);
        border-radius: 8px;
        border-left: 4px solid #e67e22;
        color: #f8f9fa;
      }
      
      .tasks-section {
        margin: 20px 0;
      }
      
      .tasks-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
        background: rgba(44, 62, 80, 0.5);
        border-radius: 8px;
        overflow: hidden;
      }
      
      .tasks-table th,
      .tasks-table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #34495e;
        color: #f8f9fa;
      }
      
      .tasks-table th {
        background: linear-gradient(135deg, #e67e22, #f39c12);
        color: white;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .total-row {
        background: rgba(230, 126, 34, 0.2);
        font-size: 16px;
        color: #ffffff;
        font-weight: 600;
      }
      
      .messages-section {
        margin: 20px 0;
        padding: 16px;
        background: rgba(52, 73, 94, 0.6);
        border-radius: 8px;
        border: 1px solid #34495e;
      }
      
      .messages {
        max-height: 300px;
        overflow-y: auto;
      }
      
      .message {
        margin: 12px 0;
        padding: 12px;
        border-radius: 8px;
        color: #f8f9fa;
      }
      
      .message-client {
        background: rgba(52, 152, 219, 0.3);
        margin-left: 20px;
        border-left: 4px solid #3498db;
      }
      
      .message-manager {
        background: rgba(243, 156, 18, 0.3);
        margin-right: 20px;
        border-left: 4px solid #f39c12;
      }
      
      .message-mechanic {
        background: rgba(39, 174, 96, 0.3);
        margin-right: 20px;
        border-left: 4px solid #27ae60;
      }
      
      .message-header {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #bdc3c7;
        margin-bottom: 4px;
      }
      
      .sender {
        font-weight: 600;
        color: #ffffff;
      }
      
      .response-section,
      .approval-section {
        margin: 20px 0;
        padding: 16px;
        border: 2px solid #34495e;
        border-radius: 8px;
        background: rgba(44, 62, 80, 0.3);
      }
      
      .response-actions,
      .approval-actions {
        margin-top: 12px;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      
      textarea {
        width: 100%;
        padding: 12px;
        border: 2px solid #34495e;
        border-radius: 8px;
        background: rgba(44, 62, 80, 0.9);
        color: #ffffff;
        font-family: inherit;
        resize: vertical;
      }
      
      textarea::placeholder {
        color: #bdc3c7;
        opacity: 0.8;
      }
      
      textarea:focus {
        border-color: #e67e22;
        background: rgba(44, 62, 80, 1);
        box-shadow: 0 0 10px rgba(230, 126, 34, 0.3);
        outline: none;
      }
      
      .approve-btn {
        background: linear-gradient(135deg, #27ae60, #2ecc71);
        border: 2px solid #27ae60;
        color: white;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      }
      
      .reject-btn {
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        border: 2px solid #e74c3c;
        color: white;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      }
      
      .message-btn {
        background: linear-gradient(135deg, #3498db, #2980b9);
        border: 2px solid #3498db;
        color: white;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      }
      
      .details-btn {
        background: linear-gradient(135deg, #f39c12, #e67e22);
        border: 2px solid #f39c12;
        color: white;
        font-size: 12px;
        padding: 6px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      }
      
      .close-btn {
        background: linear-gradient(135deg, #7f8c8d, #95a5a6);
        border: 2px solid #7f8c8d;
        color: white;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      }
      
      button:disabled {
        background: #7f8c8d;
        border-color: #95a5a6;
        cursor: not-allowed;
      }
      
      .status {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .status-approved {
        background: linear-gradient(135deg, #27ae60, #2ecc71);
        color: white;
      }
      
      .status-rejected {
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        color: white;
      }
      
      .status-validated {
        background: linear-gradient(135deg, #27ae60, #2ecc71);
        color: white;
      }
      
      .status-paid {
        background: linear-gradient(135deg, #3498db, #2980b9);
        color: white;
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
        color: #f8f9fa;
      }
      
      .modal-content h3 {
        color: #ffffff;
        border-bottom: 2px solid #e67e22;
        padding-bottom: 8px;
      }
      
      .modal-content h4 {
        color: #f8f9fa;
      }
      
      .modal-content p, .modal-content li {
        color: #f8f9fa;
      }
      
      .modal-content strong {
        color: #ffffff;
        font-weight: 600;
      }
      
      .detail-section {
        margin: 16px 0;
        padding: 12px;
        background: rgba(52, 73, 94, 0.6);
        border-radius: 8px;
        border-left: 4px solid #e67e22;
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