import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkOrdersService } from '../../core/services/workorders.service';
import { AppointmentsService } from '../../core/services/appointments.service';
import { UsersService } from '../../core/services/users.service';
import { VehiclesService } from '../../core/services/vehicles.service';
import type { WorkOrder, Appointment, User, Vehicle } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-manager-workorders-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wrap">
      <h2>Ordres de réparation (manager)</h2>

      <div class="card">
        <h3>Créer un ordre de réparation</h3>
        <p>Sélectionnez un rendez-vous confirmé pour créer un ordre de réparation :</p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Véhicule</th>
              <th>Mécanicien</th>
              <th>Note client</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of availableAppointments(); trackBy: trackByAppointmentId">
              <td>{{ a.scheduledAt ? (a.scheduledAt | date : 'short') : '-' }}</td>
              <td>{{ getUserName(a.clientId) }}</td>
              <td>{{ getVehicleInfo(a.vehicleId) }}</td>
              <td>{{ getUserName(a.mechanicId) || 'Non assigné' }}</td>
              <td>{{ a.clientNote || '-' }}</td>
              <td>
                <button (click)="createForAppointment(a._id)" [disabled]="creating()">
                  Créer ordre
                </button>
                <small class="debug">ID: {{ a._id.substring(0, 8) }}...</small>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="availableAppointments().length === 0" class="info">
          Aucun rendez-vous confirmé disponible pour créer un ordre de réparation.
        </p>
      </div>

      <div class="card">
        <h3>Ordres de réparation existants</h3>
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
                <button (click)="validate(w._id)" [disabled]="w.status !== 'draft'">
                  Valider
                </button>
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
      .status-paid {
        background: #d1ecf1;
        color: #0c5460;
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
  error = signal<string | null>(null);
  success = signal<string | null>(null);

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

  getUserName(userId?: string): string {
    if (!userId) return '';
    const user = this.users().find(u => u.id === userId);
    return user ? user.fullName : 'Utilisateur inconnu';
  }

  getVehicleInfo(vehicleId: string): string {
    const vehicle = this.vehicles().find(v => v._id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plate})` : 'Véhicule inconnu';
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
}

