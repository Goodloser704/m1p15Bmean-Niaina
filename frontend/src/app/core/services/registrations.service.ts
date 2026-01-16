import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import type { User } from '../models';

@Injectable({ providedIn: 'root' })
export class RegistrationsService {
  constructor(private http: HttpClient) {}

  async getPendingRegistrations(): Promise<User[]> {
    const res = await firstValueFrom(
      this.http.get<{ users: User[] }>(`${API_BASE_URL}/api/users/pending`)
    );
    return res.users;
  }

  async updateStatus(
    userId: string, 
    status: 'approved' | 'rejected',
    contractData?: {
      contractType?: string;
      baseSalary?: number;
      commissionRate?: number;
      bankDetails?: {
        iban?: string;
        bic?: string;
        bankName?: string;
      };
    }
  ): Promise<User> {
    const payload: any = { status };
    
    // Ajouter les données de contrat si fournies
    if (contractData) {
      Object.assign(payload, contractData);
    }

    const res = await firstValueFrom(
      this.http.patch<{ user: User }>(`${API_BASE_URL}/api/users/${userId}/status`, payload)
    );
    return res.user;
  }
}
