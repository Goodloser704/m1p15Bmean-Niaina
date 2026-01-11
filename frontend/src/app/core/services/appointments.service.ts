import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import type { Appointment, AppointmentStatus } from '../models';

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  constructor(private http: HttpClient) {}

  async list(): Promise<Appointment[]> {
    const res = await firstValueFrom(
      this.http.get<{ appointments: Appointment[] }>(`${API_BASE_URL}/api/appointments`)
    );
    return res.appointments;
  }

  async request(vehicleId: string, clientNote: string): Promise<Appointment> {
    const res = await firstValueFrom(
      this.http.post<{ appointment: Appointment }>(`${API_BASE_URL}/api/appointments`, { vehicleId, clientNote })
    );
    return res.appointment;
  }

  async confirm(
    id: string,
    input: { scheduledAt?: string; mechanicId?: string; managerNote?: string }
  ): Promise<Appointment> {
    const res = await firstValueFrom(
      this.http.patch<{ appointment: Appointment }>(`${API_BASE_URL}/api/appointments/${id}/confirm`, input)
    );
    return res.appointment;
  }

  async setStatus(id: string, status: AppointmentStatus, mechanicNote?: string): Promise<Appointment> {
    try {
      const res = await firstValueFrom(
        this.http.patch<{ appointment: Appointment }>(`${API_BASE_URL}/api/appointments/${id}/status`, {
          status,
          mechanicNote
        })
      );
      return res.appointment;
    } catch (error: any) {
      // Propager l'erreur avec le message du serveur
      if (error.error?.message) {
        throw new Error(error.error.message);
      }
      throw error;
    }
  }
}

