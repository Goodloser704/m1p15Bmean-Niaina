import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolsService } from '../../core/services/tools.service';
import type { Tool, ToolReservation } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-mechanic-tools-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-mechanic-theme">
      <div class="wrap">
        <h2>🔧 Outils et Consommables</h2>

        <!-- Mes Réservations Actives -->
        <div class="card" *ngIf="myReservations().length > 0">
          <h3>🔒 Mes Réservations Actives</h3>
          <div class="reservations-list">
            <div *ngFor="let reservation of myReservations()" class="reservation-item">
              <div class="reservation-info">
                <div class="tool-name">
                  {{ toolsService.getCategoryIcon(reservation.tool?.category || '') }} 
                  {{ reservation.tool?.name }}
                </div>
                <div class="reservation-details">
                  <span class="quantity">{{ reservation.quantityReserved }} unité(s)</span>
                  <span class="status" [style.color]="toolsService.getStatusColor(reservation.status)">
                    {{ toolsService.getStatusLabel(reservation.status) }}
                  </span>
                  <span class="date">{{ reservation.reservedAt | date:'short' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistiques -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🔧</div>
            <div class="stat-content">
              <div class="stat-value">{{ availableTools() }}</div>
              <div class="stat-label">Outils Disponibles</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-content">
              <div class="stat-value">{{ availableConsumables() }}</div>
              <div class="stat-label">Consommables</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⚠️</div>
            <div class="stat-content">
              <div class="stat-value">{{ lowStockCount() }}</div>
              <div class="stat-label">Stock Bas</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔒</div>
            <div class="stat-content">
              <div class="stat-value">{{ myReservations().length }}</div>
              <div class="stat-label">Mes Réservations</div>
            </div>
          </div>
        </div>

        <!-- Filtres -->
        <div class="card">
          <div class="filters-section">
            <input 
              type="text" 
              [(ngModel)]="searchTerm" 
              (input)="applyFilters()"
              placeholder="🔍 Rechercher un outil..."
              class="search-input"
            />

            <select [(ngModel)]="selectedCategory" (change)="applyFilters()" class="filter-select">
              <option value="">Toutes catégories</option>
              <option *ngFor="let category of categories()" [value]="category">
                {{ toolsService.getCategoryIcon(category) }} {{ category | titlecase }}
              </option>
            </select>

            <select [(ngModel)]="availabilityFilter" (change)="applyFilters()" class="filter-select">
              <option value="">Tous</option>
              <option value="available">Disponibles</option>
              <option value="unavailable">Indisponibles</option>
            </select>

            <select [(ngModel)]="typeFilter" (change)="applyFilters()" class="filter-select">
              <option value="">Tous types</option>
              <option value="tools">Outils réutilisables</option>
              <option value="consumables">Consommables</option>
            </select>

            <button (click)="loadTools()" [disabled]="loading()" class="btn-secondary">
              🔄 Actualiser
            </button>
          </div>
        </div>

        <!-- Liste des Outils -->
        <div class="tools-grid" *ngIf="filteredTools().length > 0">
          <div *ngFor="let tool of filteredTools()" class="tool-card" 
               [class.unavailable]="tool.availableQuantity === 0"
               [class.low-stock]="tool.isLowStock && tool.availableQuantity > 0">
            
            <div class="tool-header">
              <div class="tool-icon">{{ toolsService.getCategoryIcon(tool.category) }}</div>
              <div class="tool-info">
                <h3>{{ tool.name }}</h3>
                <p class="tool-category">{{ tool.category | titlecase }}</p>
                <p class="tool-description" *ngIf="tool.description">{{ tool.description }}</p>
              </div>
              <div class="availability-badge" 
                   [class.available]="tool.availableQuantity > 0"
                   [class.unavailable]="tool.availableQuantity === 0">
                {{ tool.availableQuantity > 0 ? '✅ Disponible' : '❌ Indisponible' }}
              </div>
            </div>

            <div class="tool-details">
              <div class="quantity-section">
                <div class="quantity-display">
                  <span class="available" [class.zero]="tool.availableQuantity === 0">
                    {{ tool.availableQuantity }}
                  </span>
                  <span class="separator">/</span>
                  <span class="total">{{ tool.totalQuantity }}</span>
                </div>
                <div class="quantity-label">Disponible / Total</div>
              </div>

              <div class="type-section">
                <span class="type-badge" [class.consumable]="tool.isConsumable">
                  {{ tool.isConsumable ? '📦 Consommable' : '🔧 Outil' }}
                </span>
              </div>

              <div class="condition-section">
                <span class="condition-badge" [style.background-color]="toolsService.getConditionColor(tool.condition)">
                  {{ toolsService.getConditionLabel(tool.condition) }}
                </span>
              </div>
            </div>

            <div class="tool-location" *ngIf="tool.location">
              <span class="location-icon">📍</span>
              <span>{{ tool.location }}</span>
            </div>

            <div class="tool-specs" *ngIf="tool.supplier || tool.reference">
              <div *ngIf="tool.supplier" class="spec-item">
                <strong>Fournisseur:</strong> {{ tool.supplier }}
              </div>
              <div *ngIf="tool.reference" class="spec-item">
                <strong>Référence:</strong> {{ tool.reference }}
              </div>
            </div>

            <div class="tool-alerts">
              <div class="alert low-stock" *ngIf="tool.isLowStock && tool.availableQuantity > 0">
                ⚠️ Stock bas
              </div>
              <div class="alert out-of-stock" *ngIf="tool.availableQuantity === 0">
                ❌ Rupture de stock
              </div>
              <div class="alert maintenance" *ngIf="tool.condition === 'poor' || tool.condition === 'out_of_order'">
                🔧 Maintenance requise
              </div>
            </div>

            <div class="tool-price" *ngIf="tool.isConsumable && tool.unitPrice > 0">
              <strong>{{ tool.unitPrice | currency:'EUR':'symbol':'1.2-2' }}</strong>
              <small>/ unité</small>
            </div>
          </div>
        </div>

        <div class="card" *ngIf="filteredTools().length === 0 && !loading()">
          <p class="no-data">Aucun outil trouvé avec les filtres actuels.</p>
        </div>

        <p class="error" *ngIf="error()">{{ error() }}</p>
        <div class="loading" *ngIf="loading()">🔄 Chargement...</div>
      </div>
    </div>
  `,
  styles: [`
    /* Styles optimisés pour réduire la taille */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: linear-gradient(135deg, rgba(230, 126, 34, 0.1), rgba(243, 156, 18, 0.1)); border: 2px solid #e67e22; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; }
    .stat-icon { font-size: 24px; opacity: 0.8; }
    .stat-content { flex: 1; }
    .stat-value { font-size: 24px; font-weight: 700; color: #e67e22; line-height: 1; }
    .stat-label { font-size: 11px; color: #bdc3c7; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
    .reservations-list { display: flex; flex-direction: column; gap: 12px; }
    .reservation-item { background: rgba(52, 73, 94, 0.3); border: 1px solid #34495e; border-radius: 8px; padding: 12px; }
    .reservation-info { display: flex; justify-content: space-between; align-items: center; }
    .tool-name { font-weight: 600; color: #f8f9fa; }
    .reservation-details { display: flex; gap: 16px; font-size: 12px; }
    .quantity { color: #3498db; font-weight: 600; }
    .status { font-weight: 600; }
    .date { color: #95a5a6; }
    .filters-section { display: grid; grid-template-columns: 1fr auto auto auto auto; gap: 12px; align-items: center; }
    .search-input, .filter-select { padding: 10px 12px; border: 2px solid #34495e; border-radius: 6px; background: #2c3e50; color: #f8f9fa; font-size: 14px; }
    .search-input:focus { border-color: #e67e22; outline: none; }
    .filter-select { font-size: 13px; min-width: 120px; }
    .tools-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; margin-top: 24px; }
    .tool-card { background: linear-gradient(135deg, #2c3e50, #34495e); border: 2px solid #34495e; border-radius: 12px; padding: 18px; transition: all 0.3s ease; }
    .tool-card:hover { border-color: #e67e22; transform: translateY(-2px); box-shadow: 0 8px 25px rgba(230, 126, 34, 0.2); }
    .tool-card.unavailable { opacity: 0.6; border-color: #e74c3c; }
    .tool-card.low-stock { border-color: #f39c12; background: linear-gradient(135deg, #2c3e50, rgba(243, 156, 18, 0.1)); }
    .tool-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
    .tool-icon { font-size: 20px; opacity: 0.8; }
    .tool-info { flex: 1; }
    .tool-info h3 { color: #f8f9fa; margin: 0 0 4px 0; font-size: 15px; font-weight: 600; }
    .tool-category { color: #e67e22; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0; }
    .tool-description { color: #bdc3c7; font-size: 12px; margin: 0; }
    .availability-badge { padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; text-align: center; min-width: 80px; }
    .availability-badge.available { background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; }
    .availability-badge.unavailable { background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; }
    .tool-details { display: grid; grid-template-columns: auto auto 1fr; gap: 12px; align-items: center; margin-bottom: 12px; }
    .quantity-display { display: flex; align-items: baseline; gap: 4px; font-size: 16px; font-weight: 700; }
    .available { color: #2ecc71; }
    .available.zero { color: #e74c3c; }
    .separator { color: #7f8c8d; }
    .total { color: #bdc3c7; }
    .quantity-label { font-size: 10px; color: #95a5a6; text-transform: uppercase; letter-spacing: 1px; }
    .type-badge { padding: 3px 6px; border-radius: 10px; font-size: 10px; font-weight: 600; background: linear-gradient(135deg, #3498db, #2980b9); color: white; }
    .type-badge.consumable { background: linear-gradient(135deg, #16a085, #1abc9c); }
    .condition-badge { padding: 3px 6px; border-radius: 10px; font-size: 10px; font-weight: 600; color: white; }
    .tool-location { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #95a5a6; margin-bottom: 8px; }
    .tool-specs { margin-bottom: 8px; }
    .spec-item { font-size: 11px; color: #bdc3c7; margin-bottom: 2px; }
    .spec-item strong { color: #95a5a6; }
    .tool-alerts { margin-bottom: 8px; }
    .alert { padding: 6px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; margin-bottom: 4px; }
    .alert.low-stock { background: rgba(243, 156, 18, 0.2); border: 1px solid #f39c12; color: #f39c12; }
    .alert.out-of-stock { background: rgba(231, 76, 60, 0.2); border: 1px solid #e74c3c; color: #e74c3c; }
    .alert.maintenance { background: rgba(155, 89, 182, 0.2); border: 1px solid #9b59b6; color: #9b59b6; }
    .tool-price { text-align: right; color: #f8f9fa; font-size: 13px; }
    .tool-price small { color: #95a5a6; font-size: 10px; }
    .no-data { text-align: center; color: #95a5a6; font-style: italic; padding: 40px; }
    @media (max-width: 767px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .filters-section { grid-template-columns: 1fr; gap: 8px; }
      .tools-grid { grid-template-columns: 1fr; }
      .tool-details { grid-template-columns: 1fr; gap: 8px; }
      .reservation-info { flex-direction: column; align-items: flex-start; gap: 8px; }
      .reservation-details { flex-wrap: wrap; }
    }
  `]
})
export class MechanicToolsPageComponent {
  tools = signal<Tool[]>([]);
  categories = signal<string[]>([]);
  myReservations = signal<ToolReservation[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filtres
  searchTerm = '';
  selectedCategory = '';
  availabilityFilter = '';
  typeFilter = '';

  // Computed
  filteredTools = computed(() => {
    let filtered = this.tools();

    // Recherche textuelle
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(tool => 
        tool.name.toLowerCase().includes(term) ||
        tool.description?.toLowerCase().includes(term) ||
        tool.category.toLowerCase().includes(term)
      );
    }

    // Filtre par catégorie
    if (this.selectedCategory) {
      filtered = filtered.filter(tool => tool.category === this.selectedCategory);
    }

    // Filtre par disponibilité
    if (this.availabilityFilter === 'available') {
      filtered = filtered.filter(tool => tool.availableQuantity > 0);
    } else if (this.availabilityFilter === 'unavailable') {
      filtered = filtered.filter(tool => tool.availableQuantity === 0);
    }

    // Filtre par type
    if (this.typeFilter === 'tools') {
      filtered = filtered.filter(tool => !tool.isConsumable);
    } else if (this.typeFilter === 'consumables') {
      filtered = filtered.filter(tool => tool.isConsumable);
    }

    return filtered;
  });

  availableTools = computed(() => 
    this.tools().filter(t => !t.isConsumable && t.availableQuantity > 0).length
  );
  
  availableConsumables = computed(() => 
    this.tools().filter(t => t.isConsumable && t.availableQuantity > 0).length
  );
  
  lowStockCount = computed(() => 
    this.tools().filter(t => t.isLowStock).length
  );

  constructor(public toolsService: ToolsService) {}

  async ngOnInit(): Promise<void> {
    await this.loadTools();
    await this.loadCategories();
    await this.loadMyReservations();
  }

  async loadTools(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const tools = await this.toolsService.getTools();
      this.tools.set(tools);
    } catch (error: any) {
      this.error.set('Erreur lors du chargement des outils');
    } finally {
      this.loading.set(false);
    }
  }

  async loadCategories(): Promise<void> {
    try {
      const categories = await this.toolsService.getCategories();
      this.categories.set(categories);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  }

  async loadMyReservations(): Promise<void> {
    try {
      const reservations = await this.toolsService.getMyReservations();
      this.myReservations.set(reservations);
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
    }
  }

  applyFilters(): void {
    // Les filtres sont appliqués automatiquement via computed
  }
}