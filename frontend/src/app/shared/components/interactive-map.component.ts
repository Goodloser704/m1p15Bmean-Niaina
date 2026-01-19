import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Coordinates, NearbyClient } from '../../core/models';

declare global {
  interface Window {
    L: any;
  }
}

@Component({
  standalone: true,
  selector: 'app-interactive-map',
  imports: [CommonModule],
  template: `
    <div class="map-container">
      <div #mapElement class="map" [style.height]="height"></div>
      
      <div class="map-controls" *ngIf="showControls">
        <button (click)="centerOnUser()" class="control-btn" title="Ma position">
          📍
        </button>
        <button (click)="toggleFullscreen()" class="control-btn" title="Plein écran">
          🔍
        </button>
      </div>
      
      <div class="map-info" *ngIf="selectedMarker">
        <div class="info-content">
          <h4>{{ selectedMarker.name }}</h4>
          <p>{{ selectedMarker.address }}</p>
          <p *ngIf="selectedMarker.distance">
            📏 {{ selectedMarker.distance }}km - 🕐 {{ selectedMarker.travelTime }}min
          </p>
          <div class="info-actions">
            <button (click)="navigateToMarker(selectedMarker)" class="nav-btn">
              🧭 Navigation
            </button>
            <button (click)="closeInfo()" class="close-btn">
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-container {
      position: relative;
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .map {
      width: 100%;
      min-height: 400px;
      background: linear-gradient(135deg, #2c3e50, #34495e);
    }

    .map-controls {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 1000;
    }

    .control-btn {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
    }

    .control-btn:hover {
      background: white;
      transform: scale(1.1);
    }

    .map-info {
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: linear-gradient(135deg, #2c3e50, #34495e);
      border-radius: 12px;
      padding: 16px;
      color: white;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      z-index: 1000;
    }

    .info-content h4 {
      margin: 0 0 8px 0;
      color: #e67e22;
    }

    .info-content p {
      margin: 4px 0;
      color: #ecf0f1;
      font-size: 14px;
    }

    .info-actions {
      display: flex;
      gap: 12px;
      margin-top: 12px;
    }

    .nav-btn {
      background: linear-gradient(135deg, #e67e22, #f39c12);
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
    }

    .close-btn {
      background: rgba(127, 140, 141, 0.8);
      border: none;
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }

    .nav-btn:hover,
    .close-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  `]
})
export class InteractiveMapComponent implements OnInit, OnDestroy {
  @ViewChild('mapElement', { static: true }) mapElement!: ElementRef;
  
  @Input() center: Coordinates = { latitude: 48.8566, longitude: 2.3522 }; // Paris par défaut
  @Input() zoom = 13;
  @Input() height = '400px';
  @Input() markers: NearbyClient[] = [];
  @Input() showControls = true;
  @Input() userPosition?: Coordinates;
  
  @Output() markerClick = new EventEmitter<NearbyClient>();
  @Output() mapClick = new EventEmitter<Coordinates>();

  private map: any;
  private userMarker: any;
  private markersLayer: any;
  selectedMarker: NearbyClient | null = null;

  ngOnInit() {
    this.loadLeaflet().then(() => {
      this.initMap();
    });
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private async loadLeaflet(): Promise<void> {
    if (window.L) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      // Charger Leaflet CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);

      // Charger Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  private initMap(): void {
    this.map = window.L.map(this.mapElement.nativeElement).setView(
      [this.center.latitude, this.center.longitude],
      this.zoom
    );

    // Ajouter les tuiles OpenStreetMap
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Créer le layer pour les marqueurs
    this.markersLayer = window.L.layerGroup().addTo(this.map);

    // Ajouter la position utilisateur si disponible
    if (this.userPosition) {
      this.addUserMarker(this.userPosition);
    }

    // Ajouter les marqueurs
    this.updateMarkers();

    // Écouter les clics sur la carte
    this.map.on('click', (e: any) => {
      this.mapClick.emit({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      });
    });
  }

  private addUserMarker(position: Coordinates): void {
    const userIcon = window.L.divIcon({
      html: '<div style="background: #e67e22; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      className: 'user-marker'
    });

    this.userMarker = window.L.marker([position.latitude, position.longitude], {
      icon: userIcon
    }).addTo(this.map);

    this.userMarker.bindPopup('📍 Votre position');
  }

  private updateMarkers(): void {
    if (!this.markersLayer) return;

    // Nettoyer les marqueurs existants
    this.markersLayer.clearLayers();

    // Ajouter les nouveaux marqueurs
    this.markers.forEach(marker => {
      const clientIcon = window.L.divIcon({
        html: `<div style="background: #3498db; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        className: 'client-marker'
      });

      const leafletMarker = window.L.marker(
        [marker.coordinates.latitude, marker.coordinates.longitude],
        { icon: clientIcon }
      );

      leafletMarker.bindPopup(`
        <div style="color: #2c3e50;">
          <strong>${marker.name}</strong><br>
          ${marker.address}<br>
          📏 ${marker.distance}km - 🕐 ${marker.travelTime}min
        </div>
      `);

      leafletMarker.on('click', () => {
        this.selectedMarker = marker;
        this.markerClick.emit(marker);
      });

      this.markersLayer.addLayer(leafletMarker);
    });
  }

  centerOnUser(): void {
    if (this.userPosition) {
      this.map.setView([this.userPosition.latitude, this.userPosition.longitude], 15);
    } else {
      // Demander la géolocalisation
      navigator.geolocation?.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          this.userPosition = coords;
          this.addUserMarker(coords);
          this.map.setView([coords.latitude, coords.longitude], 15);
        },
        (error) => {
          console.error('Erreur géolocalisation:', error);
        }
      );
    }
  }

  toggleFullscreen(): void {
    const mapContainer = this.mapElement.nativeElement.parentElement;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      mapContainer?.requestFullscreen();
    }
  }

  navigateToMarker(marker: NearbyClient): void {
    const url = `https://www.google.com/maps/dir/${this.userPosition?.latitude || ''},${this.userPosition?.longitude || ''}/${marker.coordinates.latitude},${marker.coordinates.longitude}`;
    window.open(url, '_blank');
  }

  closeInfo(): void {
    this.selectedMarker = null;
  }

  // Méthodes publiques pour mise à jour
  updateCenter(center: Coordinates): void {
    this.center = center;
    if (this.map) {
      this.map.setView([center.latitude, center.longitude], this.zoom);
    }
  }

  updateMarkersList(markers: NearbyClient[]): void {
    this.markers = markers;
    this.updateMarkers();
  }

  updateUserPosition(position: Coordinates): void {
    this.userPosition = position;
    if (this.userMarker) {
      this.userMarker.setLatLng([position.latitude, position.longitude]);
    } else {
      this.addUserMarker(position);
    }
  }
}