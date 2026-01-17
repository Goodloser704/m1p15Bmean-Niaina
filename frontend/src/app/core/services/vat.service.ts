import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import type { VatSettings } from '../models';

@Injectable({ providedIn: 'root' })
export class VatService {
  constructor(private http: HttpClient) {}

  async getSettings(): Promise<VatSettings> {
    const res = await firstValueFrom(
      this.http.get<{ settings: VatSettings }>(`${API_BASE_URL}/api/vat/settings`)
    );
    return res.settings;
  }

  async updateSettings(settings: Partial<VatSettings>): Promise<VatSettings> {
    const res = await firstValueFrom(
      this.http.put<{ settings: VatSettings }>(`${API_BASE_URL}/api/vat/settings`, settings)
    );
    return res.settings;
  }
}