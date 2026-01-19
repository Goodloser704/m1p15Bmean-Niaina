const express = require("express");
const Garage = require("../models/Garage");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const geocodingService = require("../services/geocodingService");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Géocoder une adresse
router.post("/geocode", requireAuth, async (req, res) => {
  try {
    const { address, city, postalCode, country } = req.body;
    
    if (!address || !city) {
      return res.status(400).json({ message: "Adresse et ville requises" });
    }

    const coordinates = await geocodingService.geocodeAddress(
      address, city, postalCode, country
    );

    return res.json({ coordinates });
  } catch (error) {
    console.error("❌ Erreur géocodage:", error);
    return res.status(500).json({ message: error.message });
  }
});

// Géocodage inverse
router.post("/reverse-geocode", requireAuth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Coordonnées requises" });
    }

    const address = await geocodingService.reverseGeocode(latitude, longitude);

    return res.json({ address });
  } catch (error) {
    console.error("❌ Erreur géocodage inverse:", error);
    return res.status(500).json({ message: error.message });
  }
});

// Calculer la distance entre deux points
router.post("/distance", requireAuth, async (req, res) => {
  try {
    const { from, to } = req.body;
    
    if (!from?.latitude || !from?.longitude || !to?.latitude || !to?.longitude) {
      return res.status(400).json({ message: "Coordonnées de départ et d'arrivée requises" });
    }

    const distance = geocodingService.calculateDistance(
      from.latitude, from.longitude,
      to.latitude, to.longitude
    );

    const travelTime = geocodingService.estimateTravelTime(distance);

    return res.json({ 
      distance: Math.round(distance * 100) / 100, // Arrondi à 2 décimales
      travelTime,
      unit: 'km'
    });
  } catch (error) {
    console.error("❌ Erreur calcul distance:", error);
    return res.status(500).json({ message: "Erreur lors du calcul de distance" });
  }
});

// Trouver les clients les plus proches (pour les mécaniciens à domicile)
router.get("/nearby-clients", requireAuth, requireRole(["manager", "mechanic"]), async (req, res) => {
  try {
    const { latitude, longitude, radius = 25, assignedOnly = 'false' } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Position requise" });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const maxRadius = parseFloat(radius);

    let clientFilter = { 
      role: 'client',
      address: { $exists: true, $ne: '' }
    };

    // Si c'est un mécanicien et qu'il veut seulement ses clients assignés
    if (req.user.role === 'mechanic' && assignedOnly === 'true') {
      // Trouver les rendez-vous assignés à ce mécanicien
      const assignedAppointments = await Appointment.find({ 
        mechanicId: req.user._id 
      }).distinct('clientId');
      
      if (assignedAppointments.length > 0) {
        clientFilter._id = { $in: assignedAppointments };
      } else {
        // Aucun client assigné
        return res.json({ clients: [] });
      }
    }

    // Récupérer les clients selon le filtre
    const clients = await User.find(clientFilter);

    const nearbyClients = [];

    for (const client of clients) {
      if (client.location && client.location.coordinates) {
        const distance = geocodingService.calculateDistance(
          lat, lon,
          client.location.coordinates.latitude,
          client.location.coordinates.longitude
        );

        if (distance <= maxRadius) {
          // Vérifier si ce client a des rendez-vous avec ce mécanicien
          let isAssigned = false;
          if (req.user.role === 'mechanic') {
            const hasAppointment = await Appointment.findOne({
              clientId: client._id,
              mechanicId: req.user._id
            });
            isAssigned = !!hasAppointment;
          }

          nearbyClients.push({
            id: client._id,
            name: client.fullName,
            address: client.address,
            distance: Math.round(distance * 100) / 100,
            travelTime: geocodingService.estimateTravelTime(distance),
            coordinates: client.location.coordinates,
            isAssigned: isAssigned || req.user.role === 'manager' // Manager voit tous les clients
          });
        }
      }
    }

    // Trier par distance
    nearbyClients.sort((a, b) => a.distance - b.distance);

    return res.json({ clients: nearbyClients });
  } catch (error) {
    console.error("❌ Erreur recherche clients:", error);
    return res.status(500).json({ message: "Erreur lors de la recherche" });
  }
});

// Optimiser un itinéraire (algorithme simple du plus proche voisin)
router.post("/optimize-route", requireAuth, requireRole(["manager", "mechanic"]), async (req, res) => {
  try {
    const { startPoint, destinations } = req.body;
    
    if (!startPoint || !destinations || destinations.length === 0) {
      return res.status(400).json({ message: "Point de départ et destinations requis" });
    }

    // Algorithme simple du plus proche voisin
    const optimizedRoute = [];
    let currentPoint = startPoint;
    let remainingDestinations = [...destinations];
    let totalDistance = 0;
    let totalTime = 0;

    while (remainingDestinations.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      // Trouver la destination la plus proche
      remainingDestinations.forEach((dest, index) => {
        const distance = geocodingService.calculateDistance(
          currentPoint.latitude, currentPoint.longitude,
          dest.latitude, dest.longitude
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      // Ajouter à l'itinéraire optimisé
      const nextDestination = remainingDestinations[nearestIndex];
      const travelTime = geocodingService.estimateTravelTime(nearestDistance);
      
      optimizedRoute.push({
        ...nextDestination,
        distanceFromPrevious: Math.round(nearestDistance * 100) / 100,
        travelTimeFromPrevious: travelTime
      });

      totalDistance += nearestDistance;
      totalTime += travelTime;

      // Mettre à jour pour la prochaine itération
      currentPoint = nextDestination;
      remainingDestinations.splice(nearestIndex, 1);
    }

    return res.json({
      optimizedRoute,
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalTime,
      savings: {
        message: "Itinéraire optimisé par rapport à l'ordre original",
        // TODO: Calculer les économies réelles
      }
    });
  } catch (error) {
    console.error("❌ Erreur optimisation itinéraire:", error);
    return res.status(500).json({ message: "Erreur lors de l'optimisation" });
  }
});

module.exports = router;