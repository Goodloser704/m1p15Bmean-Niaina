import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import type { User } from '../models';

type LoginResponse = { token: string; user: User };
type RegisterResponse = { token?: string; user: User; message: string };
type MeResponse = { user: User };

const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get user(): User | null {
    return this.userSubject.value;
  }

  async init(): Promise<void> {
    const token = this.token;
    if (!token) {
      this.userSubject.next(null);
      return;
    }
    try {
      const me = await firstValueFrom(this.http.get<MeResponse>(`${API_BASE_URL}/api/auth/me`));
      this.userSubject.next(me.user);
    } catch {
      this.clearSession();
    }
  }

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<LoginResponse>(`${API_BASE_URL}/api/auth/login`, { email, password })
    );
    localStorage.setItem(TOKEN_KEY, res.token);
    this.userSubject.next(res.user);
  }

  async register(data: {
    fullName: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    address?: string;
  }): Promise<RegisterResponse> {
    const res = await firstValueFrom(
      this.http.post<RegisterResponse>(`${API_BASE_URL}/api/auth/register`, data)
    );
    
    // Si un token est retourné (client), on se connecte automatiquement
    if (res.token) {
      localStorage.setItem(TOKEN_KEY, res.token);
      this.userSubject.next(res.user);
    }
    
    return res;
  }

  logout(): void {
    this.clearSession();
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.userSubject.next(null);
  }
}

