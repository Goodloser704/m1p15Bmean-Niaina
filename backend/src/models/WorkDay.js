const mongoose = require('mongoose');

const workDaySchema = new mongoose.Schema({
  mechanicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['declared', 'approved', 'rejected'],
    default: 'declared'
  },
  hoursWorked: {
    type: Number,
    default: 8, // 8 heures par défaut
    min: 0,
    max: 24
  },
  notes: {
    type: String,
    maxlength: 500
  },
  declaredAt: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Index composé pour éviter les doublons
workDaySchema.index({ mechanicId: 1, date: 1 }, { unique: true });

// Index pour les requêtes par statut
workDaySchema.index({ status: 1 });

// Index pour les requêtes par date
workDaySchema.index({ date: 1 });

// Méthode pour vérifier si c'est un jour ouvré
workDaySchema.methods.isWorkingDay = function() {
  const dayOfWeek = this.date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Dimanche = 0, Samedi = 6
  
  // Jours fériés fixes (à adapter selon le pays)
  const year = this.date.getFullYear();
  const publicHolidays = [
    new Date(year, 0, 1),   // Nouvel An
    new Date(year, 4, 1),   // Fête du Travail
    new Date(year, 4, 8),   // Victoire 1945
    new Date(year, 6, 14),  // Fête Nationale
    new Date(year, 7, 15),  // Assomption
    new Date(year, 10, 1),  // Toussaint
    new Date(year, 10, 11), // Armistice
    new Date(year, 11, 25), // Noël
  ];
  
  const isPublicHoliday = publicHolidays.some(holiday => 
    holiday.getTime() === this.date.getTime()
  );
  
  return !isWeekend && !isPublicHoliday;
};

// Méthode statique pour obtenir les jours travaillés approuvés d'un mécanicien
workDaySchema.statics.getApprovedWorkDays = function(mechanicId, startDate, endDate) {
  return this.find({
    mechanicId,
    date: {
      $gte: startDate,
      $lte: endDate
    },
    status: 'approved'
  }).sort({ date: 1 });
};

// Méthode statique pour calculer les heures travaillées dans une période
workDaySchema.statics.calculateWorkedHours = function(mechanicId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        mechanicId: new mongoose.Types.ObjectId(mechanicId),
        date: {
          $gte: startDate,
          $lte: endDate
        },
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        totalHours: { $sum: '$hoursWorked' },
        totalDays: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('WorkDay', workDaySchema);