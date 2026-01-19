import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import type { Coordinates, Location, DistanceResult, NearbyClient, OptimizedRoute, RoutePoint } from '../models';

@Injectable({ providedIn: 'root' })
export class MapsService {
  constructor(private http: HttpClient) {}

  /**
   * Géocoder une adresse (adresse → coordonnées)
   */
  async geocodeAddress(address: string, city: string, postalCode?: string, country = 'France'): Promise<Coordinates> {
    const res = await firstValueFrom(
      this.http.post<{ coordinates: Coordinates }>(`${API_BASE_URL}/api/maps/geocode`, {
        address,
        city,
        postalCode,
        country
      })
    );
    return res.coordinates;
  }

  /**
   * Géocodage inverse (coordonnées → adresse)
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<Location> {
    const res = await firstValueFrom(
      this.http.post<{ address: Location }>(`${API_BASE_URL}/api/maps/reverse-geocode`, {
        latitude,
        longitude
      })
    );
    return res.address;
  }

  /**
   * Calculer la distance entre deux points
   */
  async calculateDistance(from: Coordinates, to: Coordinates): Promise<DistanceResult> {
    const res = await firstValueFrom(
      this.http.post<DistanceResult>(`${API_BASE_URL}/api/maps/distance`, {
        from,
        to
      })
    );
    return res;
  }

  /**
   * Trouver les clients proches (pour mécaniciens)
   */
  async findNearbyClients(latitude: number, longitude: number, radius = 25): Promise<NearbyClient[]> {
    const res = await firstValueFrom(
      this.http.get<{ clients: NearbyClient[] }>(`${API_BASE_URL}/api/maps/nearby-clients`, {
        params: {
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          radius: radius.toString()
        }
      })
    );
    return res.clients;
  }

  /**
   * Optimiser un itinéraire
   */
  async optimizeRoute(startPoint: RoutePoint, destinations: RoutePoint[]): Promise<OptimizedRoute> {
    const res = await firstValueFrom(
      this.http.post<OptimizedRoute>(`${API_BASE_URL}/api/maps/optimize-route`, {
        startPoint,
        destinations
      })
    );
    return res;
  }

  /**
   * Obtenir la position actuelle de l'utilisateur
   */
  async getCurrentPosition(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Géolocalisation non supportée'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          let message = 'Erreur de géolocalisation';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Permission de géolocalisation refusée';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Position non disponible';
              break;
            case error.TIMEOUT:
              message = 'Timeout de géolocalisation';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Surveiller la position (pour suivi en temps réel)
   */
  watchPosition(callback: (position: Coordinates) => void, errorCallback?: (error: string) => void): number {
    if (!navigator.geolocation) {
      errorCallback?.('Géolocalisation non supportée');
      return -1;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        let message = 'Erreur de géolocalisation';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permission de géolocalisation refusée';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Position non disponible';
            break;
          case error.TIMEOUT:
            message = 'Timeout de géolocalisation';
            break;
        }
        errorCallback?.(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      }
    );
  }

  /**
   * Arrêter le suivi de position
   */
  clearWatch(watchId: number): void {
    navigator.geolocation.clearWatch(watchId);
  }

  /**
   * Générer une URL Google Maps pour navigation
   */
  getGoogleMapsUrl(destination: Coordinates, origin?: Coordinates): string {
    const baseUrl = 'https://www.google.com/maps/dir/';
    
    if (origin) {
      return `${baseUrl}${origin.latitude},${origin.longitude}/${destination.latitude},${destination.longitude}`;
    } else {
      return `${baseUrl}/${destination.latitude},${destination.longitude}`;
    }
  }

  /**
   * Générer une URL Waze pour navigation
   */
  getWazeUrl(destination: Coordinates): string {
    return `https://waze.com/ul?ll=${destination.latitude}%2C${destination.longitude}&navigate=yes`;
  }

  /**
   * Calculer le centre géographique d'un ensemble de points
   */
  calculateCenter(points: Coordinates[]): Coordinates {
    if (points.length === 0) {
      throw new Error('Aucun point fourni');
    }

    const sum = points.reduce(
      (acc, point) => ({
        latitude: acc.latitude + point.latitude,
        longitude: acc.longitude + point.longitude
      }),
      { latitude: 0, longitude: 0 }
    );

    return {
      latitude: sum.latitude / points.length,
      longitude: sum.longitude / points.length
    };
  }

  /**
   * Vérifier si un point est dans un rayon donné
   */
  isWithinRadius(center: Coordinates, point: Coordinates, radiusKm: number): boolean {
    const distance = this.calculateDistanceLocal(center, point);
    return distance <= radiusKm;
  }

  /**
   * Calcul de distance local (formule de Haversine)
   */
  private calculateDistanceLocal(point1: Coordinates, point2: Coordinates): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}