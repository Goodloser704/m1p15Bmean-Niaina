import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolsService } from '../../core/services/tools.service';
import type { Tool } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-manager-tools-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-mechanic-theme">
      <div class="wrap">
        <h2>🔧 Gestion des Outils et Consommables</h2>

        <!-- Statistiques -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🔧</div>
            <div class="stat-content">
              <div class="stat-value">{{ totalTools() }}</div>
              <div class="stat-label">Total Outils</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-content">
              <div class="stat-value">{{ consumableCount() }}</div>
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
            <div class="stat-icon">❌</div>
            <div class="stat-content">
              <div class="stat-value">{{ unavailableCount() }}</div>
              <div class="stat-label">Indisponibles</div>
            </div>
          </div>
        </div>

        <!-- Contrôles et Filtres -->
        <div class="card">
          <div class="controls-section">
            <div class="search-section">
              <input 
                type="text" 
                [(ngModel)]="searchTerm" 
                (input)="applyFilters()"
                placeholder="🔍 Rechercher un outil..."
                class="search-input"
              />
            </div>

            <div class="filters-section">
              <select [(ngModel)]="selectedCategory" (change)="applyFilters()" class="filter-select">
                <option value="">Toutes catégories</option>
                <option *ngFor="let category of categories()" [value]="category">
                  {{ toolsService.getCategoryIcon(category) }} {{ category | titlecase }}
                </option>
              </select>

              <select [(ngModel)]="stockFilter" (change)="applyFilters()" class="filter-select">
                <option value="">Tous les stocks</option>
                <option value="available">Disponibles</option>
                <option value="low">Stock bas</option>
                <option value="unavailable">Indisponibles</option>
              </select>

              <select [(ngModel)]="typeFilter" (change)="applyFilters()" class="filter-select">
                <option value="">Tous types</option>
                <option value="tools">Outils réutilisables</option>
                <option value="consumables">Consommables</option>
              </select>
            </div>

            <div class="actions-section">
              <button (click)="showCreateModal = true" class="btn-primary">
                ➕ Nouvel Outil
              </button>
              <button (click)="loadTools()" [disabled]="loading()" class="btn-secondary">
                🔄 Actualiser
              </button>
            </div>
          </div>
        </div>

        <!-- Liste des Outils -->
        <div class="tools-grid" *ngIf="filteredTools().length > 0">
          <div *ngFor="let tool of filteredTools()" class="tool-card" [class.low-stock]="tool.isLowStock">
            <div class="tool-header">
              <div class="tool-icon">{{ toolsService.getCategoryIcon(tool.category) }}</div>
              <div class="tool-info">
                <h3>{{ tool.name }}</h3>
                <p class="tool-category">{{ tool.category | titlecase }}</p>
                <p class="tool-description" *ngIf="tool.description">{{ tool.description }}</p>
              </div>
              <div class="tool-type">
                <span class="type-badge" [class.consumable]="tool.isConsumable">
                  {{ tool.isConsumable ? '📦 Consommable' : '🔧 Outil' }}
                </span>
              </div>
            </div>

            <div class="tool-details">
              <div class="quantity-info">
                <div class="quantity-display">
                  <span class="available">{{ tool.availableQuantity }}</span>
                  <span class="separator">/</span>
                  <span class="total">{{ tool.totalQuantity }}</span>
                </div>
                <div class="quantity-label">Disponible / Total</div>
              </div>

              <div class="condition-info">
                <span class="condition-badge" [style.background-color]="toolsService.getConditionColor(tool.condition)">
                  {{ toolsService.getConditionLabel(tool.condition) }}
                </span>
              </div>

              <div class="price-info" *ngIf="tool.unitPrice > 0">
                <strong>{{ tool.unitPrice | currency:'EUR':'symbol':'1.2-2' }}</strong>
                <small>/ unité</small>
              </div>
            </div>

            <div class="tool-location" *ngIf="tool.location">
              <span class="location-icon">📍</span>
              <span>{{ tool.location }}</span>
            </div>

            <div class="tool-alerts" *ngIf="tool.isLowStock || tool.availableQuantity === 0">
              <div class="alert low-stock" *ngIf="tool.isLowStock && tool.availableQuantity > 0">
                ⚠️ Stock bas (seuil: {{ tool.minStockAlert }})
              </div>
              <div class="alert out-of-stock" *ngIf="tool.availableQuantity === 0">
                ❌ Rupture de stock
              </div>
            </div>

            <div class="tool-actions">
              <button (click)="openRestockModal(tool)" class="btn-restock">
                📦 Réapprovisionner
              </button>
              <button (click)="openEditModal(tool)" class="btn-edit">
                ✏️ Modifier
              </button>
            </div>
          </div>
        </div>

        <div class="card" *ngIf="filteredTools().length === 0 && !loading()">
          <p class="no-data">Aucun outil trouvé avec les filtres actuels.</p>
        </div>

        <!-- Modal Création/Édition -->
        <div class="modal" *ngIf="showCreateModal || showEditModal" (click)="closeModals()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h3>{{ showCreateModal ? '➕ Nouvel Outil' : '✏️ Modifier l\'Outil' }}</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>Nom *</label>
                <input type="text" [(ngModel)]="toolForm.name" class="form-input" required>
              </div>

              <div class="form-group">
                <label>Catégorie *</label>
                <select [(ngModel)]="toolForm.category" class="form-input" required>
                  <option value="">-- Sélectionner --</option>
                  <option *ngFor="let category of categories()" [value]="category">
                    {{ toolsService.getCategoryIcon(category) }} {{ category | titlecase }}
                  </option>
                  <option value="custom">➕ Nouvelle catégorie</option>
                </select>
              </div>

              <div class="form-group" *ngIf="toolForm.category === 'custom'">
                <label>Nouvelle catégorie</label>
                <input type="text" [(ngModel)]="newCategory" class="form-input" placeholder="Ex: pneumatiques">
              </div>

              <div class="form-group full-width">
                <label>Description</label>
                <textarea [(ngModel)]="toolForm.description" class="form-input" rows="2"></textarea>
              </div>

              <div class="form-group">
                <label>Quantité totale *</label>
                <input type="number" [(ngModel)]="toolForm.totalQuantity" class="form-input" min="0" required>
              </div>

              <div class="form-group">
                <label>Seuil d'alerte</label>
                <input type="number" [(ngModel)]="toolForm.minStockAlert" class="form-input" min="0">
              </div>

              <div class="form-group">
                <label>Prix unitaire (€)</label>
                <input type="number" [(ngModel)]="toolForm.unitPrice" class="form-input" min="0" step="0.01">
              </div>

              <div class="form-group">
                <label>Emplacement</label>
                <input type="text" [(ngModel)]="toolForm.location" class="form-input" placeholder="Ex: Atelier - Panneau A1">
              </div>

              <div class="form-group">
                <label>Fournisseur</label>
                <input type="text" [(ngModel)]="toolForm.supplier" class="form-input">
              </div>

              <div class="form-group">
                <label>Référence</label>
                <input type="text" [(ngModel)]="toolForm.reference" class="form-input">
              </div>

              <div class="form-group full-width">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="toolForm.isConsumable">
                  <span class="checkmark"></span>
                  Consommable (se décompte à l'utilisation)
                </label>
              </div>
            </div>

            <div class="modal-actions">
              <button (click)="saveTool()" [disabled]="processing()" class="btn-primary">
                {{ showCreateModal ? '➕ Créer' : '💾 Sauvegarder' }}
              </button>
              <button (click)="closeModals()" [disabled]="processing()" class="btn-secondary">
                Annuler
              </button>
            </div>
          </div>
        </div>

        <!-- Modal Réapprovisionnement -->
        <div class="modal" *ngIf="showRestockModal" (click)="closeModals()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h3>📦 Réapprovisionnement</h3>

            <div *ngIf="selectedTool()">
              <div class="tool-summary">
                <h4>{{ selectedTool()!.name }}</h4>
                <p>Stock actuel: <strong>{{ selectedTool()!.availableQuantity }}</strong> / {{ selectedTool()!.totalQuantity }}</p>
              </div>

              <div class="form-group">
                <label>Quantité à ajouter *</label>
                <input type="number" [(ngModel)]="restockQuantity" class="form-input" min="1" required>
              </div>

              <div class="restock-preview" *ngIf="restockQuantity > 0">
                <p>Nouveau stock: <strong>{{ selectedTool()!.totalQuantity + restockQuantity }}</strong></p>
              </div>
            </div>

            <div class="modal-actions">
              <button (click)="confirmRestock()" [disabled]="processing() || !restockQuantity || restockQuantity <= 0" class="btn-primary">
                📦 Réapprovisionner
              </button>
              <button (click)="closeModals()" [disabled]="processing()" class="btn-secondary">
                Annuler
              </button>
            </div>
          </div>
        </div>

        <p class="error" *ngIf="error()">{{ error() }}</p>
        <p class="success" *ngIf="success()">{{ success() }}</p>
        <div class="loading" *ngIf="loading()">🔄 Chargement...</div>
      </div>
    </div>
  `,
  styles: [`
    /* Styles optimisés pour réduire la taille */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: linear-gradient(135deg, rgba(230, 126, 34, 0.1), rgba(243, 156, 18, 0.1)); border: 2px solid #e67e22; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; }
    .stat-icon { font-size: 32px; opacity: 0.8; }
    .stat-content { flex: 1; }
    .stat-value { font-size: 28px; font-weight: 700; color: #e67e22; line-height: 1; }
    .stat-label { font-size: 12px; color: #bdc3c7; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
    .controls-section { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: start; }
    .search-section { grid-column: 1 / -1; }
    .search-input { width: 100%; padding: 12px 16px; border: 2px solid #34495e; border-radius: 8px; background: #2c3e50; color: #f8f9fa; font-size: 14px; }
    .search-input:focus { border-color: #e67e22; outline: none; }
    .filters-section { display: flex; gap: 12px; flex-wrap: wrap; }
    .filter-select { padding: 8px 12px; border: 2px solid #34495e; border-radius: 6px; background: #2c3e50; color: #f8f9fa; font-size: 13px; min-width: 150px; }
    .actions-section { display: flex; gap: 8px; }
    .tools-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 16px; margin-top: 24px; }
    .tool-card { background: linear-gradient(135deg, #2c3e50, #34495e); border: 2px solid #34495e; border-radius: 12px; padding: 20px; transition: all 0.3s ease; }
    .tool-card:hover { border-color: #e67e22; transform: translateY(-2px); box-shadow: 0 8px 25px rgba(230, 126, 34, 0.2); }
    .tool-card.low-stock { border-color: #f39c12; background: linear-gradient(135deg, #2c3e50, rgba(243, 156, 18, 0.1)); }
    .tool-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
    .tool-icon { font-size: 24px; opacity: 0.8; }
    .tool-info { flex: 1; }
    .tool-info h3 { color: #f8f9fa; margin: 0 0 4px 0; font-size: 16px; font-weight: 600; }
    .tool-category { color: #e67e22; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0; }
    .tool-description { color: #bdc3c7; font-size: 13px; margin: 0; }
    .type-badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: linear-gradient(135deg, #3498db, #2980b9); color: white; }
    .type-badge.consumable { background: linear-gradient(135deg, #16a085, #1abc9c); }
    .tool-details { display: grid; grid-template-columns: auto auto 1fr; gap: 16px; align-items: center; margin-bottom: 12px; }
    .quantity-display { display: flex; align-items: baseline; gap: 4px; font-size: 18px; font-weight: 700; }
    .available { color: #2ecc71; }
    .separator { color: #7f8c8d; }
    .total { color: #bdc3c7; }
    .quantity-label { font-size: 11px; color: #95a5a6; text-transform: uppercase; letter-spacing: 1px; }
    .condition-badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; color: white; }
    .price-info { text-align: right; color: #f8f9fa; }
    .price-info small { color: #95a5a6; font-size: 10px; }
    .tool-location { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #95a5a6; margin-bottom: 12px; }
    .tool-alerts { margin-bottom: 12px; }
    .alert { padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; margin-bottom: 4px; }
    .alert.low-stock { background: rgba(243, 156, 18, 0.2); border: 1px solid #f39c12; color: #f39c12; }
    .alert.out-of-stock { background: rgba(231, 76, 60, 0.2); border: 1px solid #e74c3c; color: #e74c3c; }
    .tool-actions { display: flex; gap: 8px; }
    .btn-restock, .btn-edit { padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; flex: 1; color: white; }
    .btn-restock { background: linear-gradient(135deg, #16a085, #1abc9c); border: 2px solid #16a085; }
    .btn-edit { background: linear-gradient(135deg, #3498db, #2980b9); border: 2px solid #3498db; }
    .btn-restock:hover, .btn-edit:hover { transform: translateY(-1px); }
    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(5px); }
    .modal-content { background: linear-gradient(135deg, #2c3e50, #34495e); padding: 30px; border-radius: 16px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); border: 2px solid #e67e22; }
    .modal-content h3 { color: #ffffff; margin-top: 0; margin-bottom: 24px; text-align: center; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { color: #f8f9fa; margin-bottom: 6px; font-weight: 600; font-size: 13px; }
    .form-input { padding: 10px 12px; border: 2px solid #34495e; border-radius: 6px; background: #2c3e50; color: #f8f9fa; font-size: 14px; }
    .form-input:focus { border-color: #e67e22; outline: none; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; color: #f8f9fa; }
    .checkmark { width: 18px; height: 18px; border: 2px solid #34495e; border-radius: 4px; background: #2c3e50; position: relative; }
    input[type="checkbox"]:checked + .checkmark { background: #e67e22; border-color: #e67e22; }
    input[type="checkbox"]:checked + .checkmark::after { content: '✓'; position: absolute; top: -2px; left: 2px; color: white; font-size: 12px; font-weight: bold; }
    input[type="checkbox"] { display: none; }
    .tool-summary { background: rgba(52, 73, 94, 0.5); padding: 16px; border-radius: 8px; margin-bottom: 20px; }
    .tool-summary h4 { color: #f8f9fa; margin: 0 0 8px 0; }
    .tool-summary p { color: #bdc3c7; margin: 0; }
    .restock-preview { background: rgba(46, 204, 113, 0.1); border: 1px solid #2ecc71; padding: 12px; border-radius: 6px; margin-top: 12px; }
    .restock-preview p { color: #2ecc71; margin: 0; font-weight: 600; }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
    .no-data { text-align: center; color: #95a5a6; font-style: italic; padding: 40px; }
    @media (max-width: 767px) {
      .controls-section { grid-template-columns: 1fr; gap: 12px; }
      .filters-section { flex-direction: column; }
      .filter-select { min-width: auto; }
      .tools-grid { grid-template-columns: 1fr; }
      .tool-details { grid-template-columns: 1fr; gap: 8px; }
      .form-grid { grid-template-columns: 1fr; }
      .modal-actions { flex-direction: column; }
    }
  `]
})
export class ManagerToolsPageComponent {
  tools = signal<Tool[]>([]);
  categories = signal<string[]>([]);
  loading = signal(false);
  processing = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Filtres
  searchTerm = '';
  selectedCategory = '';
  stockFilter = '';
  typeFilter = '';

  // Modals
  showCreateModal = false;
  showEditModal = false;
  showRestockModal = false;
  selectedTool = signal<Tool | null>(null);

  // Formulaires
  toolForm: any = {};
  newCategory = '';
  restockQuantity = 0;

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

    // Filtre par stock
    if (this.stockFilter === 'available') {
      filtered = filtered.filter(tool => tool.availableQuantity > 0);
    } else if (this.stockFilter === 'low') {
      filtered = filtered.filter(tool => tool.isLowStock);
    } else if (this.stockFilter === 'unavailable') {
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

  totalTools = computed(() => this.tools().length);
  consumableCount = computed(() => this.tools().filter(t => t.isConsumable).length);
  lowStockCount = computed(() => this.tools().filter(t => t.isLowStock).length);
  unavailableCount = computed(() => this.tools().filter(t => t.availableQuantity === 0).length);

  constructor(public toolsService: ToolsService) {}

  async ngOnInit(): Promise<void> {
    await this.loadTools();
    await this.loadCategories();
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

  applyFilters(): void {
    // Les filtres sont appliqués automatiquement via computed
  }

  openEditModal(tool: Tool): void {
    this.selectedTool.set(tool);
    this.toolForm = { ...tool };
    this.showEditModal = true;
  }

  openRestockModal(tool: Tool): void {
    this.selectedTool.set(tool);
    this.restockQuantity = 0;
    this.showRestockModal = true;
  }

  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showRestockModal = false;
    this.selectedTool.set(null);
    this.toolForm = {};
    this.newCategory = '';
    this.restockQuantity = 0;
  }

  async saveTool(): Promise<void> {
    this.processing.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      // Utiliser la nouvelle catégorie si spécifiée
      if (this.toolForm.category === 'custom' && this.newCategory) {
        this.toolForm.category = this.newCategory.toLowerCase().trim();
      }

      if (this.showCreateModal) {
        await this.toolsService.createTool(this.toolForm);
        this.success.set('Outil créé avec succès !');
      } else {
        await this.toolsService.updateTool(this.selectedTool()!.id, this.toolForm);
        this.success.set('Outil mis à jour avec succès !');
      }

      await this.loadTools();
      await this.loadCategories();
      this.closeModals();
    } catch (error: any) {
      this.error.set(error.error?.message || 'Erreur lors de la sauvegarde');
    } finally {
      this.processing.set(false);
    }
  }

  async confirmRestock(): Promise<void> {
    if (!this.selectedTool() || this.restockQuantity <= 0) return;

    this.processing.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      await this.toolsService.restockTool(this.selectedTool()!.id, this.restockQuantity);
      this.success.set(`Réapprovisionnement effectué: +${this.restockQuantity} unités`);
      await this.loadTools();
      this.closeModals();
    } catch (error: any) {
      this.error.set(error.error?.message || 'Erreur lors du réapprovisionnement');
    } finally {
      this.processing.set(false);
    }
  }
}