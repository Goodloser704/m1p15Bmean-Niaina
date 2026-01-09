import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkOrdersService } from '../../core/services/workorders.service';
import type { WorkOrder } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-manager-workorders-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wrap">
      <h2>Ordres de réparation (manager)</h2>

      <div class="card">
        <div class="row">
          <input placeholder="AppointmentId" [(ngModel)]="appointmentId" />
          <button (click)="create()" [disabled]="creating()">Créer ordre</button>
        </div>
      </div>

      <div class="card">
        <table>
          <thead>
            <tr>
              <th>Statut</th>
              <th>Rendez-vous</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let w of workOrders()">
              <td>{{ w.status }}</td>
              <td>{{ w.appointmentId }}</td>
              <td class="actions">
                <button (click)="validate(w._id)" [disabled]="w.status !== 'draft'">Valider</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="error" *ngIf="error()">{{ error() }}</p>
    </div>
  `,
  styles: [
    `
      .wrap {
        max-width: 980px;
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
      .row {
        display: grid;
        grid-template-columns: 1fr 160px;
        gap: 8px;
      }
      input {
        padding: 10px;
        border-radius: 8px;
        border: 1px solid #ccc;
      }
      button {
        padding: 10px;
        border-radius: 8px;
        border: 0;
        background: #0b57d0;
        color: #fff;
        cursor: pointer;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        text-align: left;
        padding: 8px;
        border-bottom: 1px solid #eee;
      }
      .actions {
        min-width: 120px;
      }
      .error {
        margin-top: 10px;
        color: #b00020;
      }
    `
  ]
})
export class ManagerWorkOrdersPageComponent {
  workOrders = signal<WorkOrder[]>([]);
  creating = signal(false);
  error = signal<string | null>(null);

  appointmentId = '';

  constructor(private workOrdersService: WorkOrdersService) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.workOrders.set(await this.workOrdersService.list());
  }

  async create(): Promise<void> {
    if (!this.appointmentId) return;
    this.creating.set(true);
    this.error.set(null);
    try {
      await this.workOrdersService.create(this.appointmentId);
      this.appointmentId = '';
      await this.refresh();
    } catch {
      this.error.set("Création impossible (vérifiez l'appointmentId)");
    } finally {
      this.creating.set(false);
    }
  }

  async validate(id: string): Promise<void> {
    this.error.set(null);
    try {
      await this.workOrdersService.validate(id);
      await this.refresh();
    } catch {
      this.error.set('Validation impossible');
    }
  }
}

