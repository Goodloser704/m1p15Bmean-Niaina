import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsService } from '../../core/services/appointments.service';
import { WorkOrdersService } from '../../core/services/workorders.service';
import { VehiclesService } from '../../core/services/vehicles.service';
import { ToolsService } from '../../core/services/tools.service';
import { AuthService } from '../../core/auth/auth.service';
import type { Appointment, WorkOrder, WorkOrderTask, Vehicle, Tool, RequiredResource, ToolAvailability } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-mechanic-workorders-enhanced-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-mechanic-theme">
      <div class="wrap">
        <h2>🔧 Atelier Mécanicien - Diagnostic & Réparations</h2>

        <!-- Rendez-vous à diagnostiquer -->
        <div class="card" *ngIf="appointmentsToEstimate().length > 0">
          <h3>🔍 Véhicules en Diagnostic</h3>
          <div class="appointments-list">
            <div *ngFor="let appointment of appointmentsToEstimate()" class="appointment-item">
              <div class="appointment-info">
                <div class="vehicle-info">
                  <strong>{{ getVehicleInfo(appointment.vehicleId) }}</strong>
                  <span class="date">{{ appointment.scheduledAt | date:'short' }}</span>
                </div>
                <div class="problem-description">
                  <strong>Problème :</strong> {{ appointment.clientNote || 'Non spécifié' }}
                </div>
              </div>
              <div class="appointment-actions">
                <button (click)="startDiagnosis(appointment)" class="btn-primary">
                  🔍 Commencer le Diagnostic
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Work Orders à estimer -->
        <div class="card" *ngIf="workOrdersToEstimate().length > 0">
          <h3>📋 Estimations à Compléter</h3>
          <div class="workorders-list">
            <div *ngFor="let workOrder of workOrdersToEstimate()" class="workorder-item">
              <div class="workorder-info">
                <div class="vehicle-info">
                  <strong>{{ getVehicleInfoByWorkOrder(workOrder) }}</strong>
                  <span class="status">Diagnostic créé</span>
                </div>
              </div>
              <div class="workorder-actions">
                <button (click)="openEstimationModal(workOrder)" class="btn-primary">
                  📝 Créer l'Estimation
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Work Orders approuvés -->
        <div class="card" *ngIf="approvedWorkOrders().length > 0">
          <h3>✅ Réparations Approuvées</h3>
          <div class="workorders-list">
            <div *ngFor="let workOrder of approvedWorkOrders()" class="workorder-item approved">
              <div class="workorder-info">
                <div class="vehicle-info">
                  <strong>{{ getVehicleInfoByWorkOrder(workOrder) }}</strong>
                  <span class="total">{{ workOrder.total | currency:'EUR':'symbol':'1.2-2' }}</span>
                </div>
                <div class="resources-info" *ngIf="workOrder.resourcesReserved">
                  🔒 Outils réservés
                </div>
              </div>
              <div class="workorder-actions">
                <button (click)="startRepair(workOrder)" class="btn-success">
                  🔧 Commencer la Réparation
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Work Orders en cours de réparation -->
        <div class="card" *ngIf="inProgressWorkOrders().length > 0">
          <h3>🔧 Réparations en Cours</h3>
          <div class="workorders-list">
            <div *ngFor="let workOrder of inProgressWorkOrders()" class="workorder-item in-progress">
              <div class="workorder-info">
                <div class="vehicle-info">
                  <strong>{{ getVehicleInfoByWorkOrder(workOrder) }}</strong>
                  <span class="total">{{ workOrder.total | currency:'EUR':'symbol':'1.2-2' }}</span>
                </div>
                <div class="progress-info">
                  🔧 Réparation en cours...
                </div>
              </div>
              <div class="workorder-actions">
                <button (click)="completeRepair(workOrder)" class="btn-primary">
                  ✅ Marquer comme Terminée
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal d'Estimation avec Outils -->
        <div class="modal" *ngIf="showEstimationModal" (click)="closeEstimationModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h3>📝 Estimation de Réparation</h3>

            <div *ngIf="selectedWorkOrder()">
              <div class="vehicle-summary">
                <h4>{{ getVehicleInfoByWorkOrder(selectedWorkOrder()!) }}</h4>
              </div>

              <!-- Tâches -->
              <div class="section">
                <h4>🔧 Tâches à Effectuer</h4>
                <div class="tasks-list">
                  <div *ngFor="let task of currentTasks(); let i = index" class="task-item">
                    <input 
                      type="text" 
                      [(ngModel)]="task.label" 
                      placeholder="Description de la tâche"
                      class="task-input"
                    />
                    <input 
                      type="number" 
                      [(ngModel)]="task.price" 
                      placeholder="Prix (€)"
                      min="0"
                      step="0.01"
                      class="price-input"
                    />
                    <button (click)="removeTask(i)" class="btn-remove">❌</button>
                  </div>
                </div>
                <button (click)="addTask()" class="btn-secondary">➕ Ajouter une Tâche</button>
              </div>

              <!-- Outils Nécessaires -->
              <div class="section">
                <h4>🛠️ Outils et Consommables Nécessaires</h4>
                <div class="tools-selection">
                  <div class="available-tools">
                    <h5>Outils Disponibles</h5>
                    <div class="tools-grid">
                      <div *ngFor="let tool of availableTools()" 
                           class="tool-item" 
                           [class.selected]="isToolSelected(tool.id)"
                           (click)="toggleTool(tool)">
                        <div class="tool-icon">{{ toolsService.getCategoryIcon(tool.category) }}</div>
                        <div class="tool-info">
                          <div class="tool-name">{{ tool.name }}</div>
                          <div class="tool-availability">{{ tool.availableQuantity }} disponible(s)</div>
                        </div>
                        <div class="tool-type">
                          {{ tool.isConsumable ? '📦' : '🔧' }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="selected-tools" *ngIf="currentResources().length > 0">
                    <h5>Outils Sélectionnés</h5>
                    <div class="resources-list">
                      <div *ngFor="let resource of currentResources(); let i = index" class="resource-item">
                        <div class="resource-info">
                          <strong>{{ getToolName(resource.toolId) }}</strong>
                          <span class="tool-category">{{ getToolCategory(resource.toolId) }}</span>
                        </div>
                        <div class="resource-controls">
                          <label>Quantité :</label>
                          <input 
                            type="number" 
                            [(ngModel)]="resource.quantityNeeded" 
                            min="1" 
                            [max]="getToolMaxQuantity(resource.toolId)"
                            class="quantity-input"
                          />
                          <button (click)="removeResource(i)" class="btn-remove">❌</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Vérification de Disponibilité -->
                <div class="availability-check" *ngIf="currentResources().length > 0">
                  <button (click)="checkToolsAvailability()" [disabled]="processing()" class="btn-secondary">
                    🔍 Vérifier la Disponibilité
                  </button>
                  
                  <div class="availability-results" *ngIf="toolsAvailability().length > 0">
                    <div *ngFor="let availability of toolsAvailability()" 
                         class="availability-item"
                         [class.available]="availability.available"
                         [class.unavailable]="!availability.available">
                      <span class="tool-name">{{ availability.toolName }}</span>
                      <span class="availability-status">
                        {{ availability.available ? '✅ Disponible' : '❌ ' + availability.reason }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Note d'Estimation -->
              <div class="section">
                <h4>📝 Notes</h4>
                <textarea 
                  [(ngModel)]="currentEstimationNote" 
                  placeholder="Notes sur le diagnostic et l'estimation..."
                  rows="3"
                  class="estimation-note"
                ></textarea>
              </div>

              <!-- Total -->
              <div class="total-section">
                <div class="total-display">
                  <strong>Total : {{ calculateTotal() | currency:'EUR':'symbol':'1.2-2' }}</strong>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button (click)="saveEstimation()" [disabled]="processing() || !canSaveEstimation()" class="btn-primary">
                💾 Envoyer l'Estimation
              </button>
              <button (click)="closeEstimationModal()" [disabled]="processing()" class="btn-secondary">
                Annuler
              </button>
            </div>
          </div>
        </div>

        <p class="error" *ngIf="error()">{{ error() }}</p>
        <p class="success" *ngIf="success()">{{ success() }}</p>
        <div class="loading" *ngIf="loading()">🔄 Chargement...</div>
      </div>
    </div>
  `,
  styles: [`
    .appointments-list, .workorders-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .appointment-item, .workorder-item {
      background: rgba(52, 73, 94, 0.3);
      border: 2px solid #34495e;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .workorder-item.approved {
      border-color: #27ae60;
      background: rgba(39, 174, 96, 0.1);
    }

    .workorder-item.in-progress {
      border-color: #f39c12;
      background: rgba(243, 156, 18, 0.1);
    }

    .appointment-info, .workorder-info {
      flex: 1;
    }

    .vehicle-info {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .date, .status, .total {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .date {
      background: rgba(52, 152, 219, 0.2);
      color: #3498db;
    }

    .status {
      background: rgba(243, 156, 18, 0.2);
      color: #f39c12;
    }

    .total {
      background: rgba(39, 174, 96, 0.2);
      color: #27ae60;
      font-size: 14px;
    }

    .problem-description {
      color: #bdc3c7;
      font-size: 14px;
    }

    .resources-info {
      color: #3498db;
      font-size: 12px;
      margin-top: 4px;
    }

    .progress-info {
      color: #f39c12;
      font-size: 12px;
      margin-top: 4px;
    }

    .appointment-actions, .workorder-actions {
      display: flex;
      gap: 8px;
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
      max-width: 800px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      border: 2px solid #e67e22;
    }

    .modal-content h3 {
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 24px;
      text-align: center;
    }

    .vehicle-summary {
      background: rgba(52, 73, 94, 0.5);
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .vehicle-summary h4 {
      color: #f8f9fa;
      margin: 0;
    }

    .section {
      margin-bottom: 24px;
    }

    .section h4, .section h5 {
      color: #f8f9fa;
      margin-bottom: 12px;
    }

    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }

    .task-item {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .task-input {
      flex: 2;
      padding: 8px 12px;
      border: 2px solid #34495e;
      border-radius: 6px;
      background: #2c3e50;
      color: #f8f9fa;
    }

    .price-input, .quantity-input {
      flex: 1;
      padding: 8px 12px;
      border: 2px solid #34495e;
      border-radius: 6px;
      background: #2c3e50;
      color: #f8f9fa;
    }

    .quantity-input {
      width: 80px;
      flex: none;
    }

    .btn-remove {
      background: #e74c3c;
      border: none;
      color: white;
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }

    .tools-selection {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .tools-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 300px;
      overflow-y: auto;
    }

    .tool-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: rgba(52, 73, 94, 0.3);
      border: 2px solid #34495e;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .tool-item:hover {
      border-color: #e67e22;
    }

    .tool-item.selected {
      border-color: #27ae60;
      background: rgba(39, 174, 96, 0.2);
    }

    .tool-icon {
      font-size: 20px;
    }

    .tool-info {
      flex: 1;
    }

    .tool-name {
      font-weight: 600;
      color: #f8f9fa;
      font-size: 14px;
    }

    .tool-availability {
      color: #95a5a6;
      font-size: 12px;
    }

    .tool-type {
      font-size: 16px;
    }

    .resources-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .resource-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: rgba(39, 174, 96, 0.1);
      border: 1px solid #27ae60;
      border-radius: 8px;
    }

    .resource-info {
      flex: 1;
    }

    .resource-info strong {
      color: #f8f9fa;
      display: block;
    }

    .tool-category {
      color: #95a5a6;
      font-size: 12px;
      text-transform: uppercase;
    }

    .resource-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .resource-controls label {
      color: #bdc3c7;
      font-size: 12px;
    }

    .availability-check {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #34495e;
    }

    .availability-results {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .availability-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-radius: 6px;
    }

    .availability-item.available {
      background: rgba(39, 174, 96, 0.2);
      border: 1px solid #27ae60;
    }

    .availability-item.unavailable {
      background: rgba(231, 76, 60, 0.2);
      border: 1px solid #e74c3c;
    }

    .availability-status {
      font-size: 12px;
      font-weight: 600;
    }

    .estimation-note {
      width: 100%;
      padding: 12px;
      border: 2px solid #34495e;
      border-radius: 6px;
      background: #2c3e50;
      color: #f8f9fa;
      resize: vertical;
    }

    .total-section {
      background: rgba(39, 174, 96, 0.1);
      border: 2px solid #27ae60;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }

    .total-display {
      font-size: 18px;
      color: #27ae60;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
    }

    @media (max-width: 767px) {
      .appointment-item, .workorder-item {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }

      .tools-selection {
        grid-template-columns: 1fr;
      }

      .task-item {
        flex-direction: column;
        align-items: stretch;
      }

      .resource-item {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
      }

      .modal-actions {
        flex-direction: column;
      }
    }
  `]
})
export class MechanicWorkOrdersEnhancedPageComponent {
  appointments = signal<Appointment[]>([]);
  workOrders = signal<WorkOrder[]>([]);
  vehicles = signal<Vehicle[]>([]);
  availableTools = signal<Tool[]>([]);
  toolsAvailability = signal<ToolAvailability[]>([]);
  
  loading = signal(false);
  processing = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Modal state
  showEstimationModal = false;
  selectedWorkOrder = signal<WorkOrder | null>(null);
  currentTasks = signal<WorkOrderTask[]>([]);
  currentResources = signal<RequiredResource[]>([]);
  currentEstimationNote = '';

  // Computed
  appointmentsToEstimate = computed(() => {
    const existingWorkOrderAppointments = new Set(
      this.workOrders().map(wo => wo.appointmentId)
    );
    
    return this.appointments().filter(appointment => 
      appointment.status === 'confirmed' && 
      !existingWorkOrderAppointments.has(appointment._id)
    );
  });

  workOrdersToEstimate = computed(() => {
    return this.workOrders().filter(wo => wo.status === 'draft');
  });

  approvedWorkOrders = computed(() => {
    return this.workOrders().filter(wo => wo.status === 'approved');
  });

  inProgressWorkOrders = computed(() => {
    return this.workOrders().filter(wo => wo.status === 'in_progress');
  });

  constructor(
    private appointmentsService: AppointmentsService,
    private workOrdersService: WorkOrdersService,
    private vehiclesService: VehiclesService,
    public toolsService: ToolsService,
    private auth: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const [appointments, workOrders, vehicles, tools] = await Promise.all([
        this.appointmentsService.list(),
        this.workOrdersService.list(),
        this.vehiclesService.list(),
        this.toolsService.getTools({ available: true })
      ]);
      
      this.appointments.set(appointments);
      this.workOrders.set(workOrders);
      this.vehicles.set(vehicles);
      this.availableTools.set(tools);
      
    } catch (error: any) {
      this.error.set('Erreur lors du chargement des données');
    } finally {
      this.loading.set(false);
    }
  }

  async startDiagnosis(appointment: Appointment): Promise<void> {
    this.processing.set(true);
    this.error.set(null);
    
    try {
      const workOrder = await this.workOrdersService.create(appointment._id);
      this.success.set('Diagnostic commencé ! Créez maintenant votre estimation.');
      await this.loadData();
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors du démarrage du diagnostic');
    } finally {
      this.processing.set(false);
    }
  }

  openEstimationModal(workOrder: WorkOrder): void {
    this.selectedWorkOrder.set(workOrder);
    this.currentTasks.set(workOrder.tasks?.length ? [...workOrder.tasks] : [{ label: '', price: 0 }]);
    this.currentResources.set(workOrder.requiredResources?.length ? [...workOrder.requiredResources] : []);
    this.currentEstimationNote = workOrder.estimationNote || '';
    this.toolsAvailability.set([]);
    this.showEstimationModal = true;
  }

  closeEstimationModal(): void {
    this.showEstimationModal = false;
    this.selectedWorkOrder.set(null);
    this.currentTasks.set([]);
    this.currentResources.set([]);
    this.currentEstimationNote = '';
    this.toolsAvailability.set([]);
  }

  addTask(): void {
    this.currentTasks.update(tasks => [...tasks, { label: '', price: 0 }]);
  }

  removeTask(index: number): void {
    this.currentTasks.update(tasks => tasks.filter((_, i) => i !== index));
  }

  toggleTool(tool: Tool): void {
    const resources = this.currentResources();
    const existingIndex = resources.findIndex(r => r.toolId === tool.id);
    
    if (existingIndex >= 0) {
      // Retirer l'outil
      this.currentResources.update(resources => 
        resources.filter((_, i) => i !== existingIndex)
      );
    } else {
      // Ajouter l'outil
      this.currentResources.update(resources => [
        ...resources,
        {
          toolId: tool.id,
          quantityNeeded: 1,
          estimatedDuration: 0,
          notes: ''
        }
      ]);
    }
  }

  removeResource(index: number): void {
    this.currentResources.update(resources => resources.filter((_, i) => i !== index));
  }

  isToolSelected(toolId: string): boolean {
    return this.currentResources().some(r => r.toolId === toolId);
  }

  getToolName(toolId: string): string {
    const tool = this.availableTools().find(t => t.id === toolId);
    return tool?.name || 'Outil inconnu';
  }

  getToolCategory(toolId: string): string {
    const tool = this.availableTools().find(t => t.id === toolId);
    return tool?.category || '';
  }

  getToolMaxQuantity(toolId: string): number {
    const tool = this.availableTools().find(t => t.id === toolId);
    return tool?.availableQuantity || 1;
  }

  async checkToolsAvailability(): Promise<void> {
    if (this.currentResources().length === 0) return;

    this.processing.set(true);
    try {
      const result = await this.toolsService.checkAvailability(this.currentResources());
      this.toolsAvailability.set(result.availability);
      
      if (!result.allAvailable) {
        this.error.set('Certains outils ne sont pas disponibles en quantité suffisante');
      } else {
        this.success.set('Tous les outils sont disponibles !');
      }
    } catch (error: any) {
      this.error.set('Erreur lors de la vérification de disponibilité');
    } finally {
      this.processing.set(false);
    }
  }

  calculateTotal(): number {
    return this.currentTasks().reduce((sum, task) => sum + (task.price || 0), 0);
  }

  canSaveEstimation(): boolean {
    const validTasks = this.currentTasks().filter(task => task.label.trim() && task.price > 0);
    return validTasks.length > 0;
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
        this.currentEstimationNote,
        this.currentResources()
      );
      
      this.success.set('Estimation créée et envoyée au client pour approbation !');
      this.closeEstimationModal();
      await this.loadData();
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      this.processing.set(false);
    }
  }

  async startRepair(workOrder: WorkOrder): Promise<void> {
    this.processing.set(true);
    this.error.set(null);
    
    try {
      await this.workOrdersService.startRepair(workOrder._id);
      this.success.set('Réparation commencée ! Les outils sont maintenant marqués comme en cours d\'utilisation.');
      await this.loadData();
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors du démarrage de la réparation');
    } finally {
      this.processing.set(false);
    }
  }

  async completeRepair(workOrder: WorkOrder): Promise<void> {
    this.processing.set(true);
    this.error.set(null);
    
    try {
      await this.workOrdersService.completeRepair(workOrder._id);
      this.success.set('Réparation terminée ! En attente de validation du manager.');
      await this.loadData();
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors de la finalisation de la réparation');
    } finally {
      this.processing.set(false);
    }
  }

  getVehicleInfo(vehicleId: string): string {
    const vehicle = this.vehicles().find(v => v._id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plate})` : 'Véhicule inconnu';
  }

  getVehicleInfoByWorkOrder(workOrder: WorkOrder): string {
    const appointment = this.appointments().find(a => a._id === workOrder.appointmentId);
    return appointment ? this.getVehicleInfo(appointment.vehicleId) : 'Véhicule inconnu';
  }
}