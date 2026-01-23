import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../api.config';

export interface WorkDay {
  _id: string;
  mechanicId: string;
  date: string;
  status: 'declared' | 'approved' | 'rejected';
  hoursWorked: number;
  notes?: string;
  declaredAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkDayStats {
  period: {
    start: string;
    end: string;
  };
  totalHours: number;
  totalDays: number;
}

@Injectable({
  providedIn: 'root'
})
export class WorkdaysService {
  private readonly baseUrl = `${API_BASE_URL}/workdays`;

  constructor(private http: HttpClient) {}

  // Déclarer un jour de travail
  async declareWorkDay(date: string, hoursWorked: number = 8, notes?: string): Promise<{ message: string; workDay: WorkDay }> {
    const response = await this.http.post<{ message: string; workDay: WorkDay }>(`${this.baseUrl}/declare`, {
      date,
      hoursWorked,
      notes
    }).toPromise();
    return response!;
  }

  // Déclarer plusieurs jours en une fois
  async declareMultipleWorkDays(dates: string[], hoursWorked: number = 8, notes?: string): Promise<{
    message: string;
    results: WorkDay[];
    errors: Array<{ date: string; error: string }>;
  }> {
    const response = await this.http.post<{
      message: string;
      results: WorkDay[];
      errors: Array<{ date: string; error: string }>;
    }>(`${this.baseUrl}/declare-multiple`, {
      dates,
      hoursWorked,
      notes
    }).toPromise();
    return response!;
  }

  // Lister mes jours de travail
  async getMyWorkDays(month?: number, year?: number): Promise<WorkDay[]> {
    let url = `${this.baseUrl}/my-workdays`;
    const params = new URLSearchParams();
    
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await this.http.get<WorkDay[]>(url).toPromise();
    return response!;
  }

  // Lister les déclarations en attente (manager)
  async getPendingWorkDays(): Promise<WorkDay[]> {
    const response = await this.http.get<WorkDay[]>(`${this.baseUrl}/pending`).toPromise();
    return response!;
  }

  // Approuver/rejeter une déclaration (manager)
  async approveWorkDay(workDayId: string, action: 'approve' | 'reject', rejectionReason?: string): Promise<{
    message: string;
    workDay: WorkDay;
  }> {
    const response = await this.http.put<{
      message: string;
      workDay: WorkDay;
    }>(`${this.baseUrl}/${workDayId}/approve`, {
      action,
      rejectionReason
    }).toPromise();
    return response!;
  }

  // Obtenir les statistiques de travail
  async getWorkStats(mechanicId: string, startDate?: string, endDate?: string): Promise<WorkDayStats> {
    let url = `${this.baseUrl}/stats/${mechanicId}`;
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await this.http.get<WorkDayStats>(url).toPromise();
    return response!;
  }

  // Utilitaires pour les dates
  isWorkingDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Dimanche = 0, Samedi = 6
    
    // Jours fériés fixes (approximation)
    const year = date.getFullYear();
    const publicHolidays = [
      new Date(year, 0, 1),   // Nouvel An
      new Date(year, 4, 1),   // Fête du Travail
      new Date(year, 4, 8),   // Victoire 1945
      new Date(year, 6, 14),  // Fête Nationale
      new Date(year, 7, 15),  // Assomption
      new Date(year, 10, 1),  // Toussaint
      new Date(year, 10, 11), // Armistice
      new Date(year, 11, 25), // Noël
    ];
    
    const isPublicHoliday = publicHolidays.some(holiday => 
      holiday.toDateString() === date.toDateString()
    );
    
    return !isWeekend && !isPublicHoliday;
  }

  getWorkingDaysInMonth(year: number, month: number): Date[] {
    const workingDays: Date[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let currentDate = new Date(firstDay);
    
    while (currentDate <= lastDay) {
      if (this.isWorkingDay(currentDate)) {
        workingDays.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'declared': 'En attente',
      'approved': 'Approuvé',
      'rejected': 'Rejeté'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'declared': '#f39c12',
      'approved': '#27ae60',
      'rejected': '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  }
}