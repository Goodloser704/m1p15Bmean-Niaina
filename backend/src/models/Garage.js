const mongoose = require("mongoose");
const { locationSchema } = require("./Location");

const garageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  
  // Localisation du garage
  location: { type: locationSchema, required: true },
  
  // Informations business
  siret: { type: String, required: true },
  vatNumber: { type: String },
  
  // Horaires d'ouverture
  openingHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: true } }
  },
  
  // Zone de service (rayon en km)
  serviceRadius: { type: Number, default: 50 },
  
  // Services proposés
  services: [{
    name: String,
    description: String,
    estimatedDuration: Number, // en minutes
    basePrice: Number
  }],
  
  // Statut
  active: { type: Boolean, default: true }
}, { timestamps: true });

// Méthode pour calculer la distance avec un client
garageSchema.methods.distanceToClient = function(clientLocation) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (clientLocation.latitude - this.location.coordinates.latitude) * Math.PI / 180;
  const dLon = (clientLocation.longitude - this.location.coordinates.longitude) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.location.coordinates.latitude * Math.PI / 180) * 
    Math.cos(clientLocation.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance en km
};

// Méthode pour vérifier si un client est dans la zone de service
garageSchema.methods.isInServiceArea = function(clientLocation) {
  const distance = this.distanceToClient(clientLocation);
  return distance <= this.serviceRadius;
};

module.exports = mongoose.model("Garage", garageSchema);