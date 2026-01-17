const VatSettings = require('../models/VatSettings');

class VatService {
  static async calculateVatForTask(taskLabel, priceHT) {
    const settings = await VatSettings.getSettings();
    
    // Normaliser le label pour la recherche (minuscules, sans accents)
    const normalizedLabel = taskLabel.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ");
    
    // Chercher la règle qui correspond
    let vatRate = settings.defaultVatRate;
    
    for (const rule of settings.rules) {
      const hasKeyword = rule.keywords.some(keyword => 
        normalizedLabel.includes(keyword.toLowerCase())
      );
      
      if (hasKeyword) {
        vatRate = rule.vatRate;
        break;
      }
    }
    
    const vatAmount = Math.round((priceHT * vatRate / 100) * 100) / 100;
    const priceTTC = Math.round((priceHT + vatAmount) * 100) / 100;
    
    return {
      priceHT: Math.round(priceHT * 100) / 100,
      vatRate,
      vatAmount,
      priceTTC
    };
  }
  
  static async calculateInvoiceFromWorkOrder(workOrder) {
    const items = [];
    let totalHT = 0;
    let totalVAT = 0;
    
    for (const task of workOrder.tasks) {
      const vatCalc = await this.calculateVatForTask(task.label, task.price);
      
      items.push({
        label: task.label,
        priceHT: vatCalc.priceHT,
        vatRate: vatCalc.vatRate,
        vatAmount: vatCalc.vatAmount,
        priceTTC: vatCalc.priceTTC
      });
      
      totalHT += vatCalc.priceHT;
      totalVAT += vatCalc.vatAmount;
    }
    
    const totalTTC = Math.round((totalHT + totalVAT) * 100) / 100;
    totalHT = Math.round(totalHT * 100) / 100;
    totalVAT = Math.round(totalVAT * 100) / 100;
    
    return {
      items,
      totalHT,
      totalVAT,
      totalTTC
    };
  }
}

module.exports = VatService;