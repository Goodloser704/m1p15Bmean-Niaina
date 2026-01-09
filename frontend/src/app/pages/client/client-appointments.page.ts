import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsService } from '../../core/services/appointments.service';
import { VehiclesService } from '../../core/services/vehicles.service';
import type { Appointment, Vehicle } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-client-appointments-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wrap">
      <h2>Mes rendez-vous</h2>

      <div class="card">
        <h3>Demander un rendez-vous</h3>
        <div class="row">
          <select [(ngModel)]="vehicleId">
            <option [ngValue]="''">Sélectionner un véhicule</option>
            <option *ngFor="let v of vehicles()" [ngValue]="v._id">{{ v.make }} {{ v.model }} ({{ v.plate }})</option>
          </select>
          <input placeholder="Note (optionnel)" [(ngModel)]="clientNote" />
          <button (click)="request()" [disabled]="saving()">Envoyer</button>
        </div>
        <p class="error" *ngIf="error()">{{ error() }}</p>
      </div>

      <div class="card">
        <h3>Historique</h3>
        <table>
          <thead>
            <tr>
              <th>Statut</th>
              <th>Date planifiée</th>
              <th>Note manager</th>
              <th>Note mécanicien</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of appointments()">
              <td>{{ a.status }}</td>
              <td>{{ a.scheduledAt ? (a.scheduledAt | date : 'short') : '-' }}</td>
              <td>{{ a.managerNote || '-' }}</td>
              <td>{{ a.mechanicNote || '-' }}</td>
            </tr>
          </tbody>
        </table>
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
      }
      .row {
        display: grid;
        grid-template-columns: 1fr 2fr 180px;
        gap: 8px;
        align-items: center;
      }
      input,
      select {
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
      .error {
        margin-top: 10px;
        color: #b00020;
      }
      @media (max-width: 900px) {
        .row {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class ClientAppointmentsPageComponent {
  vehicles = signal<Vehicle[]>([]);
  appointments = signal<Appointment[]>([]);
  saving = signal(false);
  error = signal<string | null>(null);

  vehicleId = '';
  clientNote = '';

  constructor(
    private appointmentsService: AppointmentsService,
    private vehiclesService: VehiclesService
  ) {}

  async ngOnInit(): Promise<void> {
    this.vehicles.set(await this.vehiclesService.list());
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.appointments.set(await this.appointmentsService.list());
  }

  async request(): Promise<void> {
    if (!this.vehicleId) {
      this.error.set('Sélectionnez un véhicule');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.appointmentsService.request(this.vehicleId, this.clientNote);
      this.vehicleId = '';
      this.clientNote = '';
      await this.refresh();
    } catch {
      this.error.set("Impossible d'envoyer la demande");
    } finally {
      this.saving.set(false);
    }
  }
}

