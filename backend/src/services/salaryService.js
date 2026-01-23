const mongoose = require('mongoose');
const WorkDay = require('../models/WorkDay');

/**
 * Service de calcul des salaires avec gestion des spécificités temporelles
 */
class SalaryService {
  
  /**
   * Jours fériés 
   */
  static getPublicHolidays(year) {
    return [
      new Date(year, 0, 1),   // Nouvel An
      new Date(year, 4, 1),   // Fête du Travail
      new Date(year, 4, 8),   // Victoire 1945
      new Date(year, 6, 14),  // Fête Nationale
      new Date(year, 7, 15),  // Assomption
      new Date(year, 10, 1),  // Toussaint
      new Date(year, 10, 11), // Armistice
      new Date(year, 11, 25), // Noël
      // Pâques et autres fêtes mobiles à calculer si nécessaire
    ];
  }

  /**
   * Calcule le nombre de jours ouvrés dans un mois
   */
  static getWorkingDaysInMonth(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const publicHolidays = this.getPublicHolidays(year);
    
    let workingDays = 0;
    let currentDate = new Date(firstDay);
    
    while (currentDate <= lastDay) {
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Dimanche = 0, Samedi = 6
      const isPublicHoliday = publicHolidays.some(holiday => 
        holiday.getTime() === currentDate.getTime()
      );
      
      if (!isWeekend && !isPublicHoliday) {
        workingDays++;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
  }

  /**
   * Calcule le nombre de jours ouvrés travaillés par un employé dans un mois
   * Utilise les déclarations de présence si disponibles
   */
  static async getWorkedDaysInMonth(employeeId, year, month) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    try {
      // Essayer d'obtenir les jours déclarés et approuvés
      const approvedWorkDays = await WorkDay.find({
        mechanicId: employeeId,
        date: {
          $gte: startDate,
          $lte: endDate
        },
        status: 'approved'
      });
      
      if (approvedWorkDays.length > 0) {
        // Utiliser les jours réellement déclarés et approuvés
        return approvedWorkDays.length;
      }
    } catch (error) {
      console.log('Pas de déclarations trouvées, utilisation du calcul par défaut');
    }
    
    // Fallback: calculer les jours ouvrés théoriques
    return this.getWorkingDaysInMonth(year, month);
  }

  /**
   * Calcule le salaire mensuel selon le type de contrat
   */
  static async calculateMonthlySalary(employee, year, month, options = {}) {
    const {
      includeCommissions = false,
      commissionsAmount = 0,
      isPartialMonth = false,
      startDate = null,
      endDate = null
    } = options;

    let baseSalary = 0;
    const contractType = employee.contractType;
    
    switch (contractType) {
      case 'monthly':
        if (isPartialMonth && startDate && endDate) {
          // Calcul proratisé pour un mois partiel
          const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
          const workedDays = this.calculateWorkedDaysInPeriod(startDate, endDate);
          baseSalary = (employee.baseSalary / totalDaysInMonth) * workedDays;
        } else {
          // Salaire mensuel complet
          baseSalary = employee.baseSalary || 0;
        }
        break;
        
      case 'daily':
        const workedDays = isPartialMonth && startDate && endDate
          ? this.calculateWorkedDaysInPeriod(startDate, endDate)
          : await this.getWorkedDaysInMonth(employee._id, year, month);
        baseSalary = (employee.baseSalary || 0) * workedDays;
        break;
        
      case 'commission':
        baseSalary = 0; // Pas de salaire fixe
        break;
        
      default:
        baseSalary = 0;
    }

    const totalSalary = baseSalary + (includeCommissions ? commissionsAmount : 0);
    
    // Obtenir les détails des jours travaillés pour l'affichage
    let workDaysDetails = null;
    try {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      
      const approvedWorkDays = await WorkDay.find({
        mechanicId: employee._id,
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        },
        status: 'approved'
      }).sort({ date: 1 });
      
      if (approvedWorkDays.length > 0) {
        workDaysDetails = {
          declaredDays: approvedWorkDays.length,
          totalHours: approvedWorkDays.reduce((sum, day) => sum + day.hoursWorked, 0),
          averageHours: approvedWorkDays.reduce((sum, day) => sum + day.hoursWorked, 0) / approvedWorkDays.length,
          workDays: approvedWorkDays.map(day => ({
            date: day.date,
            hours: day.hoursWorked,
            notes: day.notes
          }))
        };
      }
    } catch (error) {
      console.log('Erreur lors de la récupération des détails des jours travaillés:', error.message);
    }
    
    return {
      baseSalary: Math.round(baseSalary * 100) / 100,
      commissions: includeCommissions ? commissionsAmount : 0,
      totalSalary: Math.round(totalSalary * 100) / 100,
      contractType,
      workDaysDetails,
      calculationDetails: {
        year,
        month: month + 1, // Mois en base 1
        monthName: new Date(year, month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        workingDaysInMonth: this.getWorkingDaysInMonth(year, month),
        actualWorkedDays: workDaysDetails ? workDaysDetails.declaredDays : await this.getWorkedDaysInMonth(employee._id, year, month),
        isPartialMonth,
        dailyRate: contractType === 'daily' ? employee.baseSalary : null,
        monthlyRate: contractType === 'monthly' ? employee.baseSalary : null,
        commissionRate: employee.commissionRate || 0,
        calculationMethod: workDaysDetails ? 'declared_days' : 'theoretical_days'
      }
    };
  }

  /**
   * Calcule le nombre de jours travaillés dans une période donnée
   */
  static calculateWorkedDaysInPeriod(startDate, endDate) {
    let workedDays = 0;
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    const year = currentDate.getFullYear();
    const publicHolidays = this.getPublicHolidays(year);
    
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isPublicHoliday = publicHolidays.some(holiday => 
        holiday.getTime() === currentDate.getTime()
      );
      
      if (!isWeekend && !isPublicHoliday) {
        workedDays++;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workedDays;
  }

  /**
   * Calcule les revenus sur une période donnée
   */
  static calculatePeriodEarnings(employee, startDate, endDate, paidWorkOrders = []) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Grouper les WorkOrders par mois
    const monthlyData = {};
    let totalCommissions = 0;
    
    paidWorkOrders.forEach(workOrder => {
      const workOrderDate = new Date(workOrder.updatedAt);
      if (workOrderDate >= start && workOrderDate <= end) {
        const year = workOrderDate.getFullYear();
        const month = workOrderDate.getMonth();
        const monthKey = `${year}-${month}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            year,
            month,
            workOrders: [],
            commissions: 0
          };
        }
        
        const commission = (workOrder.total || 0) * (employee.commissionRate || 0) / 100;
        monthlyData[monthKey].workOrders.push(workOrder);
        monthlyData[monthKey].commissions += commission;
        totalCommissions += commission;
      }
    });
    
    // Calculer le salaire pour chaque mois
    const monthlyEarnings = [];
    let totalBaseSalary = 0;
    
    Object.values(monthlyData).forEach(monthData => {
      const salaryCalc = this.calculateMonthlySalary(
        employee, 
        monthData.year, 
        monthData.month,
        {
          includeCommissions: true,
          commissionsAmount: monthData.commissions
        }
      );
      
      monthlyEarnings.push({
        ...salaryCalc,
        workOrdersCount: monthData.workOrders.length
      });
      
      totalBaseSalary += salaryCalc.baseSalary;
    });
    
    return {
      totalBaseSalary: Math.round(totalBaseSalary * 100) / 100,
      totalCommissions: Math.round(totalCommissions * 100) / 100,
      totalEarnings: Math.round((totalBaseSalary + totalCommissions) * 100) / 100,
      monthlyBreakdown: monthlyEarnings,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        startFormatted: start.toLocaleDateString('fr-FR'),
        endFormatted: end.toLocaleDateString('fr-FR')
      }
    };
  }

  /**
   * Obtient les informations de salaire pour l'affichage
   */
  static getSalaryDisplayInfo(employee) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const currentMonthSalary = this.calculateMonthlySalary(employee, currentYear, currentMonth);
    
    return {
      contractType: employee.contractType,
      contractTypeLabel: this.getContractTypeLabel(employee.contractType),
      baseSalary: employee.baseSalary || 0,
      commissionRate: employee.commissionRate || 0,
      currentMonthCalculation: currentMonthSalary,
      salaryFrequency: employee.contractType === 'daily' ? 'par jour' : 'par mois'
    };
  }

  /**
   * Libellés des types de contrat
   */
  static getContractTypeLabel(contractType) {
    const labels = {
      'monthly': 'Mensuel',
      'daily': 'Journalier',
      'commission': 'Commission uniquement'
    };
    return labels[contractType] || contractType;
  }
}

module.exports = SalaryService;