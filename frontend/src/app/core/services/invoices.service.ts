import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import type { Invoice } from '../models';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  constructor(private http: HttpClient) {}

  async list(): Promise<Invoice[]> {
    const res = await firstValueFrom(
      this.http.get<{ invoices: Invoice[] }>(`${API_BASE_URL}/api/invoices`)
    );
    return res.invoices;
  }

  async getById(id: string): Promise<Invoice> {
    const res = await firstValueFrom(
      this.http.get<{ invoice: Invoice }>(`${API_BASE_URL}/api/invoices/${id}`)
    );
    return res.invoice;
  }

  async generateFromWorkOrder(workOrderId: string): Promise<Invoice> {
    const res = await firstValueFrom(
      this.http.post<{ invoice: Invoice }>(`${API_BASE_URL}/api/invoices/generate/${workOrderId}`, {})
    );
    return res.invoice;
  }
}