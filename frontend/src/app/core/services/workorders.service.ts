import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import type { WorkOrder, WorkOrderTask } from '../models';

@Injectable({ providedIn: 'root' })
export class WorkOrdersService {
  constructor(private http: HttpClient) {}

  async list(): Promise<WorkOrder[]> {
    const res = await firstValueFrom(
      this.http.get<{ workOrders: WorkOrder[] }>(`${API_BASE_URL}/api/workorders`)
    );
    return res.workOrders;
  }

  async create(appointmentId: string): Promise<WorkOrder> {
    try {
      console.log('🔄 Creating work order for appointment:', appointmentId);
      const res = await firstValueFrom(
        this.http.post<{ workOrder: WorkOrder }>(`${API_BASE_URL}/api/workorders`, { appointmentId })
      );
      console.log('✅ Work order created:', res.workOrder);
      return res.workOrder;
    } catch (error: any) {
      console.error('❌ Error creating work order:', error);
      if (error.status === 0) {
        throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
      }
      if (error.status === 502) {
        throw new Error('Le serveur est temporairement indisponible. Réessayez dans quelques minutes.');
      }
      throw error;
    }
  }

  async updateTasks(id: string, tasks: WorkOrderTask[]): Promise<{ workOrder: WorkOrder; total: number }> {
    return await firstValueFrom(
      this.http.patch<{ workOrder: WorkOrder; total: number }>(`${API_BASE_URL}/api/workorders/${id}/tasks`, {
        tasks
      })
    );
  }

  async validate(id: string): Promise<WorkOrder> {
    const res = await firstValueFrom(
      this.http.patch<{ workOrder: WorkOrder }>(`${API_BASE_URL}/api/workorders/${id}/validate`, {})
    );
    return res.workOrder;
  }
}

