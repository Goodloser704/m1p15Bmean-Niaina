const express = require('express');
const WorkDay = require('../models/WorkDay');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Déclarer un jour de travail (mécanicien)
router.post('/declare', requireAuth, async (req, res) => {
  try {
    const { date, hoursWorked, notes } = req.body;
    const mechanicId = req.user.id;

    // Vérifier que l'utilisateur est un mécanicien
    if (req.user.role !== 'mechanic') {
      return res.status(403).json({ message: 'Seuls les mécaniciens peuvent déclarer des jours de travail' });
    }

    // Vérifier que la date n'est pas dans le futur
    const workDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (workDate > today) {
      return res.status(400).json({ message: 'Impossible de déclarer un jour de travail dans le futur' });
    }

    // Vérifier que c'est un jour ouvré
    const dayOfWeek = workDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (isWeekend) {
      return res.status(400).json({ message: 'Impossible de déclarer un weekend comme jour de travail' });
    }

    // Vérifier les jours fériés
    const year = workDate.getFullYear();
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
      holiday.toDateString() === workDate.toDateString()
    );
    
    if (isPublicHoliday) {
      return res.status(400).json({ message: 'Impossible de déclarer un jour férié comme jour de travail' });
    }

    // Créer ou mettre à jour la déclaration
    const workDay = await WorkDay.findOneAndUpdate(
      { mechanicId, date: workDate },
      {
        mechanicId,
        date: workDate,
        hoursWorked: hoursWorked || 8,
        notes: notes || '',
        status: 'declared',
        declaredAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Jour de travail déclaré avec succès',
      workDay
    });

  } catch (error) {
    console.error('Error declaring work day:', error);
    res.status(500).json({ message: 'Erreur lors de la déclaration du jour de travail' });
  }
});

// Lister les jours de travail d'un mécanicien
router.get('/my-workdays', requireAuth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const mechanicId = req.user.id;

    // Vérifier que l'utilisateur est un mécanicien
    if (req.user.role !== 'mechanic') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    let startDate, endDate;
    
    if (month && year) {
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(month), 0);
    } else {
      // Par défaut, le mois courant
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const workDays = await WorkDay.find({
      mechanicId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1 });

    res.json(workDays);

  } catch (error) {
    console.error('Error fetching work days:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des jours de travail' });
  }
});

// Lister les déclarations en attente (manager)
router.get('/pending', requireAuth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un manager
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Seuls les managers peuvent voir les déclarations en attente' });
    }

    const pendingWorkDays = await WorkDay.find({ status: 'declared' })
      .populate('mechanicId', 'fullName email')
      .sort({ declaredAt: -1 });

    res.json(pendingWorkDays);

  } catch (error) {
    console.error('Error fetching pending work days:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des déclarations en attente' });
  }
});

// Approuver/rejeter une déclaration (manager)
router.put('/:id/approve', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approve' ou 'reject'

    // Vérifier que l'utilisateur est un manager
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Seuls les managers peuvent approuver/rejeter les déclarations' });
    }

    const workDay = await WorkDay.findById(id);
    if (!workDay) {
      return res.status(404).json({ message: 'Déclaration non trouvée' });
    }

    if (workDay.status !== 'declared') {
      return res.status(400).json({ message: 'Cette déclaration a déjà été traitée' });
    }

    if (action === 'approve') {
      workDay.status = 'approved';
      workDay.approvedBy = req.user.id;
      workDay.approvedAt = new Date();
    } else if (action === 'reject') {
      workDay.status = 'rejected';
      workDay.approvedBy = req.user.id;
      workDay.approvedAt = new Date();
      workDay.rejectionReason = rejectionReason || 'Aucune raison spécifiée';
    } else {
      return res.status(400).json({ message: 'Action invalide' });
    }

    await workDay.save();

    res.json({
      message: `Déclaration ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès`,
      workDay
    });

  } catch (error) {
    console.error('Error approving/rejecting work day:', error);
    res.status(500).json({ message: 'Erreur lors du traitement de la déclaration' });
  }
});

// Obtenir les statistiques de travail d'un mécanicien
router.get('/stats/:mechanicId', requireAuth, async (req, res) => {
  try {
    const { mechanicId } = req.params;
    const { startDate, endDate } = req.query;

    // Vérifier les permissions
    if (req.user.role !== 'manager' && req.user.id !== mechanicId) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await WorkDay.calculateWorkedHours(mechanicId, start, end);
    
    const result = stats.length > 0 ? stats[0] : { totalHours: 0, totalDays: 0 };

    res.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      ...result
    });

  } catch (error) {
    console.error('Error fetching work stats:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
});

// Déclarer plusieurs jours en une fois (mécanicien)
router.post('/declare-multiple', requireAuth, async (req, res) => {
  try {
    const { dates, hoursWorked, notes } = req.body; // dates est un array
    const mechanicId = req.user.id;

    // Vérifier que l'utilisateur est un mécanicien
    if (req.user.role !== 'mechanic') {
      return res.status(403).json({ message: 'Seuls les mécaniciens peuvent déclarer des jours de travail' });
    }

    const results = [];
    const errors = [];

    for (const dateStr of dates) {
      try {
        const workDate = new Date(dateStr);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        // Vérifications de base
        if (workDate > today) {
          errors.push({ date: dateStr, error: 'Date dans le futur' });
          continue;
        }

        const dayOfWeek = workDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          errors.push({ date: dateStr, error: 'Weekend' });
          continue;
        }

        // Créer ou mettre à jour
        const workDay = await WorkDay.findOneAndUpdate(
          { mechanicId, date: workDate },
          {
            mechanicId,
            date: workDate,
            hoursWorked: hoursWorked || 8,
            notes: notes || '',
            status: 'declared',
            declaredAt: new Date()
          },
          { upsert: true, new: true }
        );

        results.push(workDay);

      } catch (error) {
        errors.push({ date: dateStr, error: error.message });
      }
    }

    res.json({
      message: `${results.length} jour(s) déclaré(s) avec succès`,
      results,
      errors
    });

  } catch (error) {
    console.error('Error declaring multiple work days:', error);
    res.status(500).json({ message: 'Erreur lors de la déclaration des jours de travail' });
  }
});

module.exports = router;