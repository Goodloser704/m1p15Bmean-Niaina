import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkOrdersService } from '../../core/services/workorders.service';
import type { WorkOrder } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-mechanic-workorders-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wrap">
      <h2>Ordres de réparation (mécanicien)</h2>

      <div class="card">
        <table>
          <thead>
            <tr>
              <th>Statut</th>
              <th>Rendez-vous</th>
              <th>Tâches (label:prix)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let w of workOrders()">
              <td>{{ w.status }}</td>
              <td>{{ w.appointmentId }}</td>
              <td>
                <input [(ngModel)]="tasksText[w._id]" placeholder="vidange:50, frein:120" />
              </td>
              <td class="actions">
                <button (click)="saveTasks(w._id)">Enregistrer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="hint">Format: label:prix séparés par des virgules.</p>
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
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        text-align: left;
        padding: 8px;
        border-bottom: 1px solid #eee;
        vertical-align: top;
      }
      input {
        width: 100%;
        padding: 8px;
        border-radius: 8px;
        border: 1px solid #ccc;
        min-width: 260px;
      }
      button {
        padding: 8px;
        border-radius: 8px;
        border: 0;
        background: #0b57d0;
        color: #fff;
        cursor: pointer;
      }
      .actions {
        min-width: 120px;
      }
      .hint {
        margin-top: 8px;
        color: #666;
      }
      .error {
        margin-top: 10px;
        color: #b00020;
      }
    `
  ]
})
export class MechanicWorkOrdersPageComponent {
  workOrders = signal<WorkOrder[]>([]);
  error = signal<string | null>(null);

  tasksText: Record<string, string> = {};

  constructor(private workOrdersService: WorkOrdersService) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const list = await this.workOrdersService.list();
    this.workOrders.set(list);
    for (const w of list) {
      if (this.tasksText[w._id] === undefined) {
        this.tasksText[w._id] = (w.tasks || []).map((t) => `${t.label}:${t.price}`).join(', ');
      }
    }
  }

  async saveTasks(id: string): Promise<void> {
    const raw = this.tasksText[id] || '';
    const tasks = raw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((pair) => {
        const [label, priceStr] = pair.split(':').map((s) => s.trim());
        return { label: label || '', price: Number(priceStr || 0) };
      });
    try {
      await this.workOrdersService.updateTasks(id, tasks);
      await this.refresh();
    } catch {
      this.error.set('Enregistrement impossible');
    }
  }
}

