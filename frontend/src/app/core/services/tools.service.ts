import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import type { Tool, ToolReservation, ToolAvailability, RequiredResource } from '../models';

@Injectable({ providedIn: 'root' })
export class ToolsService {
  constructor(private http: HttpClient) {}

  // Récupérer tous les outils avec filtres
  async getTools(filters?: {
    category?: string;
    available?: boolean;
    lowStock?: boolean;
    search?: string;
  }): Promise<Tool[]> {
    const params: any = {};
    if (filters?.category) params.category = filters.category;
    if (filters?.available !== undefined) params.available = filters.available.toString();
    if (filters?.lowStock !== undefined) params.lowStock = filters.lowStock.toString();
    if (filters?.search) params.search = filters.search;

    const res = await firstValueFrom(
      this.http.get<{ tools: Tool[] }>(`${API_BASE_URL}/api/tools`, { params })
    );
    return res.tools;
  }

  // Récupérer les catégories d'outils
  async getCategories(): Promise<string[]> {
    const res = await firstValueFrom(
      this.http.get<{ categories: string[] }>(`${API_BASE_URL}/api/tools/categories`)
    );
    return res.categories;
  }

  // Créer un nouvel outil (Manager seulement)
  async createTool(toolData: {
    name: string;
    category: string;
    description?: string;
    totalQuantity: number;
    isConsumable: boolean;
    unitPrice?: number;
    minStockAlert?: number;
    supplier?: string;
    reference?: string;
    location?: string;
  }): Promise<Tool> {
    const res = await firstValueFrom(
      this.http.post<{ tool: Tool }>(`${API_BASE_URL}/api/tools`, toolData)
    );
    return res.tool;
  }

  // Mettre à jour un outil (Manager seulement)
  async updateTool(toolId: string, updates: Partial<Tool>): Promise<Tool> {
    const res = await firstValueFrom(
      this.http.patch<{ tool: Tool }>(`${API_BASE_URL}/api/tools/${toolId}`, updates)
    );
    return res.tool;
  }

  // Réapprovisionner un outil (Manager seulement)
  async restockTool(toolId: string, quantity: number): Promise<Tool> {
    const res = await firstValueFrom(
      this.http.post<{ tool: Tool }>(`${API_BASE_URL}/api/tools/${toolId}/restock`, { quantity })
    );
    return res.tool;
  }

  // Vérifier la disponibilité d'outils pour une estimation
  async checkAvailability(resources: RequiredResource[]): Promise<{
    allAvailable: boolean;
    availability: ToolAvailability[];
    message: string;
  }> {
    const res = await firstValueFrom(
      this.http.post<{
        allAvailable: boolean;
        availability: ToolAvailability[];
        message: string;
      }>(`${API_BASE_URL}/api/tools/check-availability`, { resources })
    );
    return res;
  }

  // Réserver des outils pour un WorkOrder
  async reserveTools(workOrderId: string, resources: RequiredResource[]): Promise<{
    reservations: ToolReservation[];
    errors?: string[];
  }> {
    const res = await firstValueFrom(
      this.http.post<{
        reservations: ToolReservation[];
        errors?: string[];
      }>(`${API_BASE_URL}/api/tools/reserve`, { workOrderId, resources })
    );
    return res;
  }

  // Libérer les réservations d'un WorkOrder
  async releaseReservations(workOrderId: string): Promise<{ releasedCount: number }> {
    const res = await firstValueFrom(
      this.http.post<{ releasedCount: number }>(`${API_BASE_URL}/api/tools/release/${workOrderId}`, {})
    );
    return res;
  }

  // Récupérer les réservations d'un mécanicien
  async getMyReservations(): Promise<ToolReservation[]> {
    const res = await firstValueFrom(
      this.http.get<{ reservations: ToolReservation[] }>(`${API_BASE_URL}/api/tools/reservations/my`)
    );
    return res.reservations;
  }

  // Utilitaires pour l'interface
  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'cles': '🔧',
      'tournevis': '🪛',
      'levage': '🏗️',
      'diagnostic': '🔍',
      'fluides': '🛢️',
      'filtres': '🔽',
      'freinage': '🛑',
      'eclairage': '💡',
      'electrique': '⚡',
      'default': '🔧'
    };
    return icons[category] || icons['default'];
  }

  getConditionColor(condition: string): string {
    const colors: Record<string, string> = {
      'excellent': '#27ae60',
      'good': '#2ecc71',
      'fair': '#f39c12',
      'poor': '#e67e22',
      'out_of_order': '#e74c3c'
    };
    return colors[condition] || colors['good'];
  }

  getConditionLabel(condition: string): string {
    const labels: Record<string, string> = {
      'excellent': 'Excellent',
      'good': 'Bon',
      'fair': 'Correct',
      'poor': 'Mauvais',
      'out_of_order': 'Hors service'
    };
    return labels[condition] || condition;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'reserved': 'Réservé',
      'in_use': 'En cours',
      'returned': 'Rendu',
      'consumed': 'Consommé'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'reserved': '#3498db',
      'in_use': '#f39c12',
      'returned': '#27ae60',
      'consumed': '#95a5a6'
    };
    return colors[status] || colors['reserved'];
  }
}