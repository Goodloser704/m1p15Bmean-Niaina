const mongoose = require("mongoose");

// Schéma pour les coordonnées géographiques
const locationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'France' },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  // Métadonnées pour optimisation
  geocodedAt: { type: Date, default: Date.now },
  source: { type: String, enum: ['manual', 'api', 'gps'], default: 'api' }
}, { _id: false });

// Index géospatial pour recherches par proximité
locationSchema.index({ "coordinates.latitude": 1, "coordinates.longitude": 1 });

module.exports = { locationSchema };