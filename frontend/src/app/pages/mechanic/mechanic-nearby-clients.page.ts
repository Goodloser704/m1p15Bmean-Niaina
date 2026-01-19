import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapsService } from '../../core/services/maps.service';
import { InteractiveMapComponent } from '../../shared/components/interactive-map.component';
import type { Coordinates, NearbyClient } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-mechanic-nearby-clients-page',
  imports: [CommonModule, FormsModule, InteractiveMapComponent],
  template: `
    <div class="page-mechanic-theme">
      <div class="wrap">
        <h2>🗺️ Clients à Proximité</h2>

        <!-- Contrôles -->
        <div class="card">
          <div class="controls-grid">
            <div class="control-group">
              <label>Rayon de recherche</label>
              <select [(ngModel)]="searchRadius" (change)="onRadiusChange()">
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
                <option value="100">100 km</option>
              </select>
            </div>

            <div class="control-group">
              <label>Position</label>
              <div class="position-controls">
                <button (click)="useCurrentLocation()" [disabled]="loading()" class="location-btn">
                  📍 Ma position
                </button>
                <button (click)="useParisLocation()" [disabled]="loading()" class="paris-btn">
                  🗼 Position Paris (test)
                </button>
                <button (click)="showAddressInput = !showAddressInput" class="address-btn">
                  📍 Autre adresse
                </button>
              </div>
            </div>

            <div class="control-group" *ngIf="currentPosition()">
              <label>Position actuelle</label>
              <p class="position-info">
                {{ currentPosition()!.latitude.toFixed(4) }}, {{ currentPosition()!.longitude.toFixed(4) }}
              </p>
            </div>

            <div class="control-group">
              <label>Filtres</label>
              <div class="filter-controls">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="showAssignedOnly"
                    (change)="onFilterChange()">
                  <span class="checkmark"></span>
                  Seulement mes clients assignés
                </label>
              </div>
            </div>
          </div>

          <!-- Saisie d'adresse -->
          <div class="address-input" *ngIf="showAddressInput">
            <div class="input-grid">
              <input 
                type="text" 
                [(ngModel)]="searchAddress.address"
                placeholder="Adresse"
                class="address-field">
              <input 
                type="text" 
                [(ngModel)]="searchAddress.city"
                placeholder="Ville"
                class="city-field">
              <input 
                type="text" 
                [(ngModel)]="searchAddress.postalCode"
                placeholder="Code postal"
                class="postal-field">
              <button (click)="geocodeAddress()" [disabled]="loading()" class="geocode-btn">
                🔍 Rechercher
              </button>
            </div>
          </div>
        </div>

        <!-- Statistiques -->
        <div class="stats-grid" *ngIf="nearbyClients().length > 0">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <div class="stat-value">{{ nearbyClients().length }}</div>
              <div class="stat-label">Clients trouvés</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📏</div>
            <div class="stat-content">
              <div class="stat-value">{{ averageDistance() }}km</div>
              <div class="stat-label">Distance moyenne</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🕐</div>
            <div class="stat-content">
              <div class="stat-value">{{ totalTravelTime() }}min</div>
              <div class="stat-label">Temps total</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
              <div class="stat-value">{{ searchRadius }}km</div>
              <div class="stat-label">Rayon recherche</div>
            </div>
          </div>
        </div>

        <!-- Carte -->
        <div class="card">
          <h3>📍 Localisation des clients</h3>
          <app-interactive-map
            [center]="mapCenter()"
            [markers]="nearbyClients()"
            [userPosition]="currentPosition() || undefined"
            [height]="'500px'"
            (markerClick)="onMarkerClick($event)">
          </app-interactive-map>
        </div>

        <!-- Liste des clients -->
        <div class="card">
          <h3>📋 Liste des clients</h3>
          
          <div *ngIf="nearbyClients().length > 0" class="clients-list">
            <div *ngFor="let client of sortedClients()" class="client-item">
              <div class="client-info">
                <h4>{{ client.name }}</h4>
                <p class="client-address">📍 {{ client.address }}</p>
                <div class="client-stats">
                  <span class="distance">📏 {{ client.distance }}km</span>
                  <span class="travel-time">🕐 {{ client.travelTime }}min</span>
                  <span class="assignment-status" [class]="client.isAssigned ? 'assigned' : 'not-assigned'">
                    {{ client.isAssigned ? '✅ Assigné' : '⚪ Non assigné' }}
                  </span>
                </div>
              </div>
              
              <div class="client-actions">
                <button (click)="navigateToClient(client)" class="nav-btn">
                  🧭 Navigation
                </button>
                <button (click)="contactClient(client)" class="contact-btn">
                  📞 Contacter
                </button>
                <button (click)="viewClientDetails(client)" class="details-btn">
                  👁️ Détails
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="nearbyClients().length === 0 && !loading()" class="no-clients">
            <div class="no-clients-icon">🔍</div>
            <h4>Aucun client trouvé</h4>
            <p>Essayez d'augmenter le rayon de recherche ou changez de position.</p>
          </div>

          <div *ngIf="loading()" class="loading">
            <div class="loading-spinner">⏳</div>
            <p>Recherche en cours...</p>
          </div>
        </div>

        <p class="error" *ngIf="error()">{{ error() }}</p>
        <p class="success" *ngIf="success()">{{ success() }}</p>
      </div>
    </div>
  `,
  styles: [`
    .controls-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .control-group label {
      color: #f8f9fa;
      font-weight: 600;
      font-size: 14px;
    }

    .control-group select {
      padding: 10px;
      border: 2px solid #34495e;
      border-radius: 8px;
      background: rgba(44, 62, 80, 0.9);
      color: #ffffff;
    }

    .position-controls {
      display: flex;
      gap: 8px;
    }

    .location-btn,
    .address-btn,
    .paris-btn {
      background: linear-gradient(135deg, #e67e22, #f39c12);
      border: 2px solid #e67e22;
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 12px;
    }

    .paris-btn {
      background: linear-gradient(135deg, #9b59b6, #8e44ad);
      border-color: #9b59b6;
    }

    .position-info {
      color: #bdc3c7;
      font-family: monospace;
      font-size: 12px;
      margin: 0;
    }

    .address-input {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 2px solid #34495e;
    }

    .input-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr auto;
      gap: 12px;
      align-items: end;
    }

    .address-field,
    .city-field,
    .postal-field {
      padding: 10px;
      border: 2px solid #34495e;
      border-radius: 8px;
      background: rgba(44, 62, 80, 0.9);
      color: #ffffff;
    }

    .geocode-btn {
      background: linear-gradient(135deg, #3498db, #2980b9);
      border: 2px solid #3498db;
      color: white;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: linear-gradient(135deg, #2c3e50, #34495e);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      border: 2px solid #34495e;
    }

    .stat-icon {
      font-size: 32px;
      opacity: 0.8;
    }

    .stat-value {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .stat-label {
      color: #bdc3c7;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .clients-list {
      margin-top: 16px;
    }

    .client-item {
      background: rgba(52, 73, 94, 0.6);
      border: 2px solid #34495e;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
    }

    .client-info h4 {
      color: #ffffff;
      margin: 0 0 8px 0;
    }

    .client-address {
      color: #bdc3c7;
      margin: 4px 0;
      font-size: 14px;
    }

    .client-stats {
      display: flex;
      gap: 16px;
      margin-top: 8px;
    }

    .distance,
    .travel-time {
      color: #e67e22;
      font-weight: 600;
      font-size: 14px;
    }

    .assignment-status {
      font-weight: 600;
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 12px;
    }

    .assignment-status.assigned {
      background: rgba(39, 174, 96, 0.2);
      color: #27ae60;
    }

    .assignment-status.not-assigned {
      background: rgba(149, 165, 166, 0.2);
      color: #95a5a6;
    }

    .filter-controls {
      margin-top: 8px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f8f9fa;
      cursor: pointer;
      font-size: 14px;
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #e67e22;
    }

    .client-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .nav-btn {
      background: linear-gradient(135deg, #e67e22, #f39c12);
      border: 2px solid #e67e22;
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 12px;
    }

    .contact-btn {
      background: linear-gradient(135deg, #27ae60, #2ecc71);
      border: 2px solid #27ae60;
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 12px;
    }

    .details-btn {
      background: linear-gradient(135deg, #3498db, #2980b9);
      border: 2px solid #3498db;
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 12px;
    }

    .no-clients {
      text-align: center;
      padding: 40px;
      color: #bdc3c7;
    }

    .no-clients-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .no-clients h4 {
      color: #ffffff;
      margin: 0 0 8px 0;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #bdc3c7;
    }

    .loading-spinner {
      font-size: 32px;
      margin-bottom: 16px;
      animation: spin 2s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class MechanicNearbyClientsPageComponent {
  nearbyClients = signal<NearbyClient[]>([]);
  currentPosition = signal<Coordinates | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  searchRadius = 25;
  showAddressInput = false;
  showAssignedOnly = false;
  searchAddress = {
    address: '',
    city: '',
    postalCode: ''
  };

  constructor(private mapsService: MapsService) {}

  async ngOnInit(): Promise<void> {
    // Utiliser Paris par défaut pour les tests au lieu de la géolocalisation automatique
    await this.useParisLocation();
  }

  mapCenter(): Coordinates {
    return this.currentPosition() || { latitude: 48.8566, longitude: 2.3522 };
  }

  async useCurrentLocation(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const position = await this.mapsService.getCurrentPosition();
      this.currentPosition.set(position);
      await this.searchNearbyClients();
      this.success.set('Position détectée avec succès !');
    } catch (error: any) {
      this.error.set(error.message || 'Erreur de géolocalisation');
    } finally {
      this.loading.set(false);
    }
  }

  async useParisLocation(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Coordonnées du centre de Paris (Place de la Concorde)
      const parisPosition = { latitude: 48.8566, longitude: 2.3522 };
      this.currentPosition.set(parisPosition);
      await this.searchNearbyClients();
      this.success.set('Position Paris définie pour les tests !');
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors de la définition de la position Paris');
    } finally {
      this.loading.set(false);
    }
  }

  async geocodeAddress(): Promise<void> {
    if (!this.searchAddress.address || !this.searchAddress.city) {
      this.error.set('Adresse et ville requises');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const coordinates = await this.mapsService.geocodeAddress(
        this.searchAddress.address,
        this.searchAddress.city,
        this.searchAddress.postalCode
      );
      
      this.currentPosition.set(coordinates);
      await this.searchNearbyClients();
      this.showAddressInput = false;
      this.success.set('Adresse géocodée avec succès !');
    } catch (error: any) {
      this.error.set(error.message || 'Erreur de géocodage');
    } finally {
      this.loading.set(false);
    }
  }

  async onRadiusChange(): Promise<void> {
    if (this.currentPosition()) {
      await this.searchNearbyClients();
    }
  }

  async onFilterChange(): Promise<void> {
    if (this.currentPosition()) {
      await this.searchNearbyClients();
    }
  }

  async searchNearbyClients(): Promise<void> {
    const position = this.currentPosition();
    if (!position) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const clients = await this.mapsService.findNearbyClients(
        position.latitude,
        position.longitude,
        this.searchRadius,
        this.showAssignedOnly
      );
      
      this.nearbyClients.set(clients);
      
      if (clients.length === 0) {
        this.success.set('Aucun client trouvé dans ce rayon');
      } else {
        this.success.set(`${clients.length} client(s) trouvé(s)`);
      }
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors de la recherche');
    } finally {
      this.loading.set(false);
    }
  }

  sortedClients(): NearbyClient[] {
    return [...this.nearbyClients()].sort((a, b) => a.distance - b.distance);
  }

  averageDistance(): number {
    const clients = this.nearbyClients();
    if (clients.length === 0) return 0;
    
    const total = clients.reduce((sum, client) => sum + client.distance, 0);
    return Math.round((total / clients.length) * 100) / 100;
  }

  totalTravelTime(): number {
    return this.nearbyClients().reduce((sum, client) => sum + client.travelTime, 0);
  }

  onMarkerClick(client: NearbyClient): void {
    console.log('Client sélectionné:', client);
  }

  navigateToClient(client: NearbyClient): void {
    const url = this.mapsService.getGoogleMapsUrl(client.coordinates, this.currentPosition() || undefined);
    window.open(url, '_blank');
  }

  contactClient(client: NearbyClient): void {
    // TODO: Implémenter contact client (téléphone, email)
    this.success.set(`Contact client ${client.name} à implémenter`);
  }

  viewClientDetails(client: NearbyClient): void {
    // TODO: Naviguer vers les détails du client
    this.success.set(`Détails client ${client.name} à implémenter`);
  }
}