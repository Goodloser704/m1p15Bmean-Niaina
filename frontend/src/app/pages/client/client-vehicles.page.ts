import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehiclesService } from '../../core/services/vehicles.service';
import type { Vehicle } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-client-vehicles-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-mechanic-theme">
      <div class="wrap">
      <h2>Mes véhicules</h2>

      <div class="card">
        <h3>Ajouter un véhicule</h3>
        <div class="row">
          <input placeholder="Marque" [(ngModel)]="make" />
          <input placeholder="Modèle" [(ngModel)]="model" />
          <input placeholder="Immatriculation" [(ngModel)]="plate" />
          <input placeholder="VIN (optionnel)" [(ngModel)]="vin" />
          <button (click)="add()" [disabled]="saving()">Ajouter</button>
        </div>
        <p class="error" *ngIf="error()">{{ error() }}</p>
      </div>

      <div class="card">
        <h3>Liste</h3>
        <table>
          <thead>
            <tr>
              <th>Marque</th>
              <th>Modèle</th>
              <th>Immatriculation</th>
              <th>VIN</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let v of vehicles()">
              <td>{{ v.make }}</td>
              <td>{{ v.model }}</td>
              <td>{{ v.plate }}</td>
              <td>{{ v.vin || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
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
        grid-template-columns: repeat(5, 1fr);
        gap: 8px;
        align-items: center;
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
export class ClientVehiclesPageComponent {
  vehicles = signal<Vehicle[]>([]);
  saving = signal(false);
  error = signal<string | null>(null);

  make = '';
  model = '';
  plate = '';
  vin = '';

  constructor(private vehiclesService: VehiclesService) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.vehicles.set(await this.vehiclesService.list());
  }

  async add(): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.vehiclesService.create({
        make: this.make,
        model: this.model,
        plate: this.plate,
        vin: this.vin || undefined
      });
      this.make = '';
      this.model = '';
      this.plate = '';
      this.vin = '';
      await this.refresh();
    } catch {
      this.error.set("Impossible d'ajouter le véhicule");
    } finally {
      this.saving.set(false);
    }
  }
}

