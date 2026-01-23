const mongoose = require('mongoose');
const User = require('./src/models/User');
const Vehicle = require('./src/models/Vehicle');
const Appointment = require('./src/models/Appointment');
const WorkOrder = require('./src/models/WorkOrder');
const Tool = require('./src/models/Tool');
const ToolReservation = require('./src/models/ToolReservation');
require('dotenv').config();

async function seedMonthlyEarnings() {
  try {
    console.log('📊 Génération de données pour test des revenus mensuels...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Récupérer les utilisateurs existants
    const client = await User.findOne({ email: 'client@demo.com' });
    const mechanic = await User.findOne({ email: 'mechanic@demo.com' });
    const mechanic2 = await User.findOne({ email: 'mechanic2@demo.com' });
    
    if (!client || !mechanic || !mechanic2) {
      console.log('❌ Utilisateurs de test non trouvés. Exécutez clean-database.js d\'abord.');
      return;
    }
    
    console.log('👥 Mécaniciens trouvés:');
    console.log(`   - ${mechanic.fullName}: ${mechanic.contractType} (${mechanic.baseSalary}€ + ${mechanic.commissionRate}%)`);
    console.log(`   - ${mechanic2.fullName}: ${mechanic2.contractType} (${mechanic2.baseSalary}€ + ${mechanic2.commissionRate}%)`);
    
    // Créer des véhicules de test
    const vehicles = [];
    for (let i = 1; i <= 5; i++) {
      const vehicle = new Vehicle({
        ownerId: client._id,
        make: ['Peugeot', 'Renault', 'Citroën', 'Volkswagen', 'BMW'][i-1],
        model: [`Model${i}`, `Serie${i}`, `Type${i}`, `Version${i}`, `Class${i}`][i-1],
        plate: `TEST-${i.toString().padStart(3, '0')}`
      });
      await vehicle.save();
      vehicles.push(vehicle);
    }
    
    console.log(`\n🚗 ${vehicles.length} véhicules créés`);
    
    // Générer des données sur 3 mois (décembre 2025, janvier 2026, février 2026)
    const months = [
      { name: 'Décembre 2025', start: new Date('2025-12-01'), end: new Date('2025-12-31') },
      { name: 'Janvier 2026', start: new Date('2026-01-01'), end: new Date('2026-01-31') },
      { name: 'Février 2026', start: new Date('2026-02-01'), end: new Date('2026-02-28') }
    ];
    
    let totalWorkOrders = 0;
    const mechanicStats = {
      [mechanic._id]: { workOrders: 0, totalEarnings: 0, commissions: 0 },
      [mechanic2._id]: { workOrders: 0, totalEarnings: 0, commissions: 0 }
    };
    
    for (const month of months) {
      console.log(`\n📅 Génération pour ${month.name}:`);
      
      // Générer 8-12 réparations par mois
      const repairsCount = Math.floor(Math.random() * 5) + 8;
      
      for (let i = 0; i < repairsCount; i++) {
        // Choisir un mécanicien aléatoirement
        const selectedMechanic = Math.random() > 0.5 ? mechanic : mechanic2;
        
        // Choisir un véhicule aléatoirement
        const selectedVehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
        
        // Date aléatoire dans le mois
        const randomDate = new Date(
          month.start.getTime() + Math.random() * (month.end.getTime() - month.start.getTime())
        );
        
        // Créer le rendez-vous
        const appointment = new Appointment({
          clientId: client._id,
          mechanicId: selectedMechanic._id,
          vehicleId: selectedVehicle._id,
          scheduledAt: randomDate,
          status: 'confirmed',
          clientNote: `Réparation ${month.name} - ${i + 1}`
        });
        await appointment.save();
        
        // Créer le WorkOrder avec des tâches variées
        const taskTypes = [
          { label: 'Vidange moteur', price: Math.floor(Math.random() * 30) + 70 },
          { label: 'Changement plaquettes frein', price: Math.floor(Math.random() * 50) + 100 },
          { label: 'Remplacement filtre à air', price: Math.floor(Math.random() * 20) + 30 },
          { label: 'Diagnostic électronique', price: Math.floor(Math.random() * 40) + 60 },
          { label: 'Réparation suspension', price: Math.floor(Math.random() * 100) + 150 },
          { label: 'Changement courroie', price: Math.floor(Math.random() * 80) + 120 },
          { label: 'Réparation climatisation', price: Math.floor(Math.random() * 60) + 90 }
        ];
        
        // Sélectionner 1-3 tâches aléatoirement
        const numTasks = Math.floor(Math.random() * 3) + 1;
        const selectedTasks = [];
        for (let t = 0; t < numTasks; t++) {
          const task = taskTypes[Math.floor(Math.random() * taskTypes.length)];
          selectedTasks.push(task);
        }
        
        const workOrder = new WorkOrder({
          appointmentId: appointment._id,
          mechanicId: selectedMechanic._id,
          status: 'paid', // Directement payé pour les statistiques
          tasks: selectedTasks,
          estimationNote: `Réparation complète - ${month.name}`,
          clientApproved: true,
          clientNote: 'Approuvé'
        });
        
        // Forcer les dates pour correspondre au mois
        workOrder.createdAt = randomDate;
        workOrder.updatedAt = new Date(randomDate.getTime() + 24 * 60 * 60 * 1000); // +1 jour
        
        await workOrder.save();
        
        // Calculer les statistiques
        const total = workOrder.total || 0;
        const commission = (total * selectedMechanic.commissionRate) / 100;
        
        mechanicStats[selectedMechanic._id].workOrders++;
        mechanicStats[selectedMechanic._id].totalEarnings += total;
        mechanicStats[selectedMechanic._id].commissions += commission;
        
        totalWorkOrders++;
      }
      
      console.log(`   ✅ ${repairsCount} réparations générées`);
    }
    
    console.log(`\n📊 RÉSUMÉ GLOBAL:`);
    console.log(`   - Total réparations: ${totalWorkOrders}`);
    console.log(`   - Période: 3 mois (Déc 2025 - Fév 2026)`);
    
    console.log(`\n💰 REVENUS PAR MÉCANICIEN:`);
    
    for (const [mechanicId, stats] of Object.entries(mechanicStats)) {
      const mech = mechanicId === mechanic._id.toString() ? mechanic : mechanic2;
      
      console.log(`\n🔧 ${mech.fullName}:`);
      console.log(`   - Contrat: ${mech.contractType}`);
      console.log(`   - Salaire base: ${mech.baseSalary}€`);
      console.log(`   - Taux commission: ${mech.commissionRate}%`);
      console.log(`   - Réparations effectuées: ${stats.workOrders}`);
      console.log(`   - Chiffre d'affaires généré: ${stats.totalEarnings.toFixed(2)}€`);
      console.log(`   - Commissions gagnées: ${stats.commissions.toFixed(2)}€`);
      
      // Calcul revenus mensuels selon le type de contrat
      let monthlyEarnings = 0;
      if (mech.contractType === 'monthly') {
        monthlyEarnings = mech.baseSalary + (stats.commissions / 3); // Moyenne sur 3 mois
      } else if (mech.contractType === 'commission') {
        monthlyEarnings = stats.commissions / 3; // Moyenne sur 3 mois
      }
      
      console.log(`   - Revenus moyens/mois: ${monthlyEarnings.toFixed(2)}€`);
      console.log(`   - Revenus totaux 3 mois: ${(mech.contractType === 'monthly' ? mech.baseSalary * 3 + stats.commissions : stats.commissions).toFixed(2)}€`);
    }
    
    console.log(`\n🧪 TESTS À EFFECTUER:`);
    console.log(`1. Connectez-vous comme mechanic@demo.com`);
    console.log(`2. Allez dans "Mes Revenus"`);
    console.log(`3. Vérifiez que les commissions s'affichent`);
    console.log(`4. Vérifiez le calcul du total mensuel`);
    console.log(`5. Connectez-vous comme mechanic2@demo.com`);
    console.log(`6. Comparez les revenus (contrat différent)`);
    
    console.log(`\n💡 ÉVOLUTION ATTENDUE:`);
    console.log(`- Les commissions s'accumulent au fil des réparations payées`);
    console.log(`- Le salaire mensuel reste fixe (contrat mensuel)`);
    console.log(`- Le total évolue = Salaire fixe + Commissions cumulées`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée.');
  }
}

seedMonthlyEarnings();