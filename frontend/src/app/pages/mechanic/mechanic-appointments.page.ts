import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsService } from '../../core/services/appointments.service';
import type { Appointment, AppointmentStatus } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-mechanic-appointments-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wrap">
      <h2>Mes rendez-vous (mécanicien)</h2>
      <div class="card">
        <table>
          <thead>
            <tr>
              <th>Statut</th>
              <th>Date</th>
              <th>Note client</th>
              <th>Note mécanicien</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of appointments()">
              <td>{{ a.status }}</td>
              <td>{{ a.scheduledAt ? (a.scheduledAt | date : 'short') : '-' }}</td>
              <td>{{ a.clientNote || '-' }}</td>
              <td>
                <input [(ngModel)]="notes[a._id]" placeholder="Note" />
              </td>
              <td class="actions">
                <select [(ngModel)]="nextStatus[a._id]">
                  <option [ngValue]="''">Choisir</option>
                  <option [ngValue]="'in_progress'">in_progress</option>
                  <option [ngValue]="'done'">done</option>
                  <option [ngValue]="'canceled'">canceled</option>
                </select>
                <button (click)="apply(a._id)">Mettre à jour</button>
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
      input,
      select {
        padding: 8px;
        border-radius: 8px;
        border: 1px solid #ccc;
      }
      .actions {
        display: grid;
        gap: 6px;
        min-width: 180px;
      }
      button {
        padding: 8px;
        border-radius: 8px;
        border: 0;
        background: #0b57d0;
        color: #fff;
        cursor: pointer;
      }
      .error {
        margin-top: 10px;
        color: #b00020;
      }
    `
  ]
})
export class MechanicAppointmentsPageComponent {
  appointments = signal<Appointment[]>([]);
  error = signal<string | null>(null);

  notes: Record<string, string> = {};
  nextStatus: Record<string, AppointmentStatus | ''> = {};

  constructor(private appointmentsService: AppointmentsService) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.appointments.set(await this.appointmentsService.list());
  }

  async apply(id: string): Promise<void> {
    const status = this.nextStatus[id];
    if (!status) return;
    try {
      await this.appointmentsService.setStatus(id, status, this.notes[id] || '');
      await this.refresh();
    } catch {
      this.error.set('Mise à jour impossible');
    }
  }
}

