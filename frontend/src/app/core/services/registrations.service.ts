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

  async updateStatus(userId: string, status: 'approved' | 'rejected'): Promise<User> {
    const res = await firstValueFrom(
      this.http.patch<{ user: User }>(`${API_BASE_URL}/api/users/${userId}/status`, { status })
    );
    return res.user;
  }
}
