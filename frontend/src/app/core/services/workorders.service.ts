import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import type { WorkOrder, WorkOrderTask, RequiredResource } from '../models';

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
      
      // Validation côté client
      if (!appointmentId || typeof appointmentId !== 'string' || appointmentId.length !== 24) {
        throw new Error('ID de rendez-vous invalide');
      }
      
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
      if (error.status === 400) {
        const message = error.error?.message || 'Données invalides';
        throw new Error(message);
      }
      if (error.status === 404) {
        throw new Error('Rendez-vous non trouvé');
      }
      if (error.status === 409) {
        throw new Error('Un ordre de réparation existe déjà pour ce rendez-vous');
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

  async updateEstimation(
    id: string, 
    tasks: WorkOrderTask[], 
    estimationNote?: string,
    requiredResources?: RequiredResource[]
  ): Promise<{ workOrder: WorkOrder; total: number }> {
    return await firstValueFrom(
      this.http.patch<{ workOrder: WorkOrder; total: number }>(`${API_BASE_URL}/api/workorders/${id}/estimate`, {
        tasks,
        estimationNote,
        requiredResources
      })
    );
  }

  async managerReview(id: string, tasks: WorkOrderTask[], action: 'send_to_client' | 'request_changes'): Promise<{ workOrder: WorkOrder; total: number }> {
    return await firstValueFrom(
      this.http.patch<{ workOrder: WorkOrder; total: number }>(`${API_BASE_URL}/api/workorders/${id}/manager-review`, {
        tasks,
        action
      })
    );
  }

  async addMessage(id: string, message: string): Promise<WorkOrder> {
    const res = await firstValueFrom(
      this.http.post<{ workOrder: WorkOrder }>(`${API_BASE_URL}/api/workorders/${id}/messages`, { message })
    );
    return res.workOrder;
  }

  async clientDecision(id: string, approved: boolean, clientNote?: string): Promise<WorkOrder> {
    const res = await firstValueFrom(
      this.http.patch<{ workOrder: WorkOrder }>(`${API_BASE_URL}/api/workorders/${id}/client-decision`, {
        approved,
        clientNote
      })
    );
    return res.workOrder;
  }

  async validate(id: string): Promise<WorkOrder> {
    const res = await firstValueFrom(
      this.http.patch<{ workOrder: WorkOrder }>(`${API_BASE_URL}/api/workorders/${id}/validate`, {})
    );
    return res.workOrder;
  }
}

