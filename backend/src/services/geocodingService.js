const axios = require('axios');

class GeocodingService {
  constructor() {
    // Utilise l'API gratuite de Nominatim (OpenStreetMap)
    this.baseUrl = 'https://nominatim.openstreetmap.org';
  }

  /**
   * Géocoder une adresse (adresse → coordonnées)
   */
  async geocodeAddress(address, city, postalCode, country = 'France') {
    try {
      const fullAddress = `${address}, ${postalCode} ${city}, ${country}`;
      
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          q: fullAddress,
          format: 'json',
          limit: 1,
          countrycodes: country === 'France' ? 'fr' : undefined
        },
        headers: {
          'User-Agent': 'GarageApp/1.0'
        }
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          formattedAddress: result.display_name
        };
      }

      throw new Error('Adresse non trouvée');
    } catch (error) {
      console.error('Erreur géocodage:', error.message);
      throw new Error('Impossible de géocoder l\'adresse');
    }
  }

  /**
   * Géocodage inverse (coordonnées → adresse)
   */
  async reverseGeocode(latitude, longitude) {
    try {
      const response = await axios.get(`${this.baseUrl}/reverse`, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json'
        },
        headers: {
          'User-Agent': 'GarageApp/1.0'
        }
      });

      if (response.data && response.data.address) {
        const addr = response.data.address;
        return {
          address: `${addr.house_number || ''} ${addr.road || ''}`.trim(),
          city: addr.city || addr.town || addr.village || '',
          postalCode: addr.postcode || '',
          country: addr.country || 'France',
          formattedAddress: response.data.display_name
        };
      }

      throw new Error('Coordonnées non trouvées');
    } catch (error) {
      console.error('Erreur géocodage inverse:', error.message);
      throw new Error('Impossible de géocoder les coordonnées');
    }
  }

  /**
   * Calculer la distance entre deux points (formule de Haversine)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Calculer le temps de trajet estimé (approximation basique)
   */
  estimateTravelTime(distanceKm, mode = 'driving') {
    const speeds = {
      walking: 5,    // km/h
      cycling: 15,   // km/h
      driving: 50,   // km/h (moyenne en ville)
      highway: 90    // km/h (autoroute)
    };

    const speed = speeds[mode] || speeds.driving;
    const timeHours = distanceKm / speed;
    return Math.round(timeHours * 60); // Retourne en minutes
  }

  /**
   * Trouver les garages les plus proches
   */
  async findNearbyGarages(clientLat, clientLon, maxDistance = 50, limit = 10) {
    // Cette méthode serait utilisée avec une base de données de garages
    // Pour l'instant, retourne un exemple
    return [
      {
        name: 'Garage Central',
        distance: this.calculateDistance(clientLat, clientLon, 48.8566, 2.3522),
        travelTime: this.estimateTravelTime(
          this.calculateDistance(clientLat, clientLon, 48.8566, 2.3522)
        )
      }
    ];
  }
}

module.exports = new GeocodingService();