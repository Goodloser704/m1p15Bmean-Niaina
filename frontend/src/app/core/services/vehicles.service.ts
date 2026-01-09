import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import type { Vehicle } from '../models';

@Injectable({ providedIn: 'root' })
export class VehiclesService {
  constructor(private http: HttpClient) {}

  async list(): Promise<Vehicle[]> {
    const res = await firstValueFrom(this.http.get<{ vehicles: Vehicle[] }>(`${API_BASE_URL}/api/vehicles`));
    return res.vehicles;
  }

  async create(input: Pick<Vehicle, 'make' | 'model' | 'plate' | 'vin'>): Promise<Vehicle> {
    const res = await firstValueFrom(
      this.http.post<{ vehicle: Vehicle }>(`${API_BASE_URL}/api/vehicles`, input)
    );
    return res.vehicle;
  }
}

