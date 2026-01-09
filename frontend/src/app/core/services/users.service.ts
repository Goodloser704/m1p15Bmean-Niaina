import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import type { User, UserRole } from '../models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private http: HttpClient) {}

  async list(role?: UserRole): Promise<User[]> {
    const url = new URL(`${API_BASE_URL}/api/users`);
    if (role) url.searchParams.set('role', role);
    const res = await firstValueFrom(this.http.get<{ users: User[] }>(url.toString()));
    return res.users;
  }
}

