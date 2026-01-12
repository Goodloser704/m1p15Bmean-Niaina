import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsService } from '../../core/services/appointments.service';
import { WorkOrdersService } from '../../core/services/workorders.service';
import { VehiclesService } from '../../core/services/vehicles.service';
import { UsersService } from '../../core/services/users.service';
import { AuthService } from '../../core/auth/auth.service';
import type { Appointment, WorkOrder, WorkOrderTask, Vehicle, User } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-mechanic-workorders-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mechanic-theme">
      <div class="mechanic-wrap">
        <div class="mechanic-banner">
          🔧 Interface Mécanicien v2.0 - Atelier Numérique Avancé 🔧
        </div>
        
        <h2 class="mechanic-title">🛠️ Atelier Mécanicien - Diagnostic & Réparations ⚙️</h2>

        <!-- Debug Info -->
        <div class="debug-card">
          <h4>🔍 Tableau de Bord Technique</h4>
          <div class="debug-info">
            <p><strong>Utilisateur connecté:</strong> {{ getCurrentUser() }}</p>
            <p><strong>Rendez-vous chargés:</strong> {{ appointments().length }}</p>
            <p><strong>Work orders chargés:</strong> {{ workOrders().length }}</p>
            <p><strong>Véhicules chargés:</strong> {{ vehicles().length }}</p>
            <p><strong>Rendez-vous à estimer:</strong> {{ appointmentsToEstimate().length }}</p>
            <p><strong>Réparations approuvées:</strong> {{ approvedWorkOrders().length }}</p>
            <p><strong>En attente approbation:</strong> {{ pendingWorkOrders().length }}</p>
          </div>
          <button (click)="testApiCall()" class="mechanic-btn test-btn">🧪 Diagnostic Système</button>
        </div>

        <!-- Rendez-vous en diagnostic -->
        <div class="mechanic-card">
          <h3>🔍 Véhicules en Diagnostic</h3>
          <table class="mechanic-table">
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
                  <button (click)="startDiagnostic(a._id)" [disabled]="processing()" class="mechanic-btn">
                    Commencer diagnostic
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="appointmentsToEstimate().length === 0" class="mechanic-alert mechanic-alert-info">
            Aucun rendez-vous à diagnostiquer.
          </p>
        </div>

        <p class="mechanic-alert mechanic-alert-error" *ngIf="error()">{{ error() }}</p>
        <p class="mechanic-alert mechanic-alert-success" *ngIf="success()">{{ success() }}</p>
      </div>
    </div>
  `,
  styles: []
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
    private usersService: UsersService,
    private authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      const [appointments, workOrders, vehicles] = await Promise.all([
        this.appointmentsService.list(),
        this.workOrdersService.list(),
        this.vehiclesService.list()
      ]);
      
      this.appointments.set(appointments);
      this.workOrders.set(workOrders);
      this.vehicles.set(vehicles);
      this.users.set([]); // Pas besoin des utilisateurs pour le mécanicien
      
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
    
    return this.appointments().filter(appointment => 
      appointment.status === 'confirmed' && 
      !existingWorkOrderAppointments.has(appointment._id)
    );
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

  getCurrentUser(): string {
    const user = this.authService.user;
    return user ? `${user.fullName} (${user.id}) - Role: ${user.role}` : 'Non connecté';
  }

  async testApiCall(): Promise<void> {
    console.log('🧪 TEST API DIRECT - Début du test...');
    try {
      console.log('🔑 Token actuel:', this.authService.token ? 'Présent' : 'Absent');
      console.log('👤 Utilisateur actuel:', this.authService.user);
      
      const appointments = await this.appointmentsService.list();
      console.log('📅 API Appointments - Résultat direct:', appointments);
      
      const workOrders = await this.workOrdersService.list();
      console.log('🔧 API WorkOrders - Résultat direct:', workOrders);
      
      // Test sans les users pour éviter l'erreur 403
      this.success.set(`Test API réussi! Appointments: ${appointments.length}, WorkOrders: ${workOrders.length}`);
    } catch (error: any) {
      console.error('❌ Erreur test API:', error);
      this.error.set(`Erreur test API: ${error.message || error}`);
    }
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

