import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsService } from '../../core/services/appointments.service';
import { UsersService } from '../../core/services/users.service';
import type { Appointment, User } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-manager-appointments-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-mechanic-theme">
      <div class="wrap">
      <h2>Rendez-vous (manager)</h2>

      <div class="card">
        <table>
          <thead>
            <tr>
              <th>Statut</th>
              <th>Véhicule</th>
              <th>Date</th>
              <th>Mécanicien</th>
              <th>Note manager</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of appointments()">
              <td>{{ a.status }}</td>
              <td>{{ a.vehicleId }}</td>
              <td>
                <input type="datetime-local" [(ngModel)]="scheduledAt[a._id]" />
              </td>
              <td>
                <select [(ngModel)]="mechanicId[a._id]">
                  <option [ngValue]="''">Non assigné</option>
                  <option *ngFor="let m of mechanics()" [ngValue]="m.id">{{ m.fullName }}</option>
                </select>
              </td>
              <td>
                <input [(ngModel)]="managerNote[a._id]" placeholder="Note" />
              </td>
              <td class="actions">
                <button (click)="confirm(a._id)">Confirmer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="error" *ngIf="error()">{{ error() }}</p>
      </div>
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
      .error {
        margin-top: 10px;
        color: #b00020;
      }
    `
  ]
})
export class ManagerAppointmentsPageComponent {
  appointments = signal<Appointment[]>([]);
  mechanics = signal<User[]>([]);
  error = signal<string | null>(null);

  scheduledAt: Record<string, string> = {};
  mechanicId: Record<string, string> = {};
  managerNote: Record<string, string> = {};

  constructor(
    private appointmentsService: AppointmentsService,
    private usersService: UsersService
  ) {}

  async ngOnInit(): Promise<void> {
    this.mechanics.set(await this.usersService.list('mechanic'));
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const list = await this.appointmentsService.list();
    this.appointments.set(list);
    for (const a of list) {
      if (this.mechanicId[a._id] === undefined) this.mechanicId[a._id] = a.mechanicId || '';
      if (this.managerNote[a._id] === undefined) this.managerNote[a._id] = a.managerNote || '';
      if (this.scheduledAt[a._id] === undefined) {
        this.scheduledAt[a._id] = a.scheduledAt ? this.toLocalInput(a.scheduledAt) : '';
      }
    }
  }

  async confirm(id: string): Promise<void> {
    try {
      await this.appointmentsService.confirm(id, {
        scheduledAt: this.scheduledAt[id] ? new Date(this.scheduledAt[id]).toISOString() : undefined,
        mechanicId: this.mechanicId[id] || undefined,
        managerNote: this.managerNote[id] || ''
      });
      await this.refresh();
    } catch {
      this.error.set('Confirmation impossible');
    }
  }

  private toLocalInput(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}`;
  }
}

