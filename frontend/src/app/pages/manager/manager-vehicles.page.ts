import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehiclesService } from '../../core/services/vehicles.service';
import type { Vehicle } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-manager-vehicles-page',
  imports: [CommonModule],
  template: `
    <div class="wrap">
      <h2>Véhicules (manager)</h2>
      <div class="card">
        <table>
          <thead>
            <tr>
              <th>Marque</th>
              <th>Modèle</th>
              <th>Immatriculation</th>
              <th>Propriétaire</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let v of vehicles()">
              <td>{{ v.make }}</td>
              <td>{{ v.model }}</td>
              <td>{{ v.plate }}</td>
              <td>{{ v.ownerId }}</td>
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
      }
    `
  ]
})
export class ManagerVehiclesPageComponent {
  vehicles = signal<Vehicle[]>([]);

  constructor(private vehiclesService: VehiclesService) {}

  async ngOnInit(): Promise<void> {
    this.vehicles.set(await this.vehiclesService.list());
  }
}

