const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Vehicle = require('./src/models/Vehicle');
const Appointment = require('./src/models/Appointment');
const WorkOrder = require('./src/models/WorkOrder');
require('dotenv').config();

async function cleanDatabase() {
  try {
    console.log('🧹 Nettoyage de la base de données...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Supprimer TOUTES les données
    console.log('\n🗑️  Suppression de toutes les données...');
    await Vehicle.deleteMany({});
    await Appointment.deleteMany({});
    await WorkOrder.deleteMany({});
    await User.deleteMany({});
    console.log('   ✅ Toutes les données supprimées');
    
    // Recréer les utilisateurs démo avec les nouveaux champs
    console.log('\n👥 Création des utilisateurs démo...');
    
    const demoUsers = [
      {
        fullName: 'Client Demo',
        email: 'client@demo.com',
        password: 'client123',
        role: 'client',
        status: 'approved',
        phone: '+33 6 12 34 56 78',
        address: '123 Rue du Client, 75001 Paris'
      },
      {
        fullName: 'Mechanic Demo',
        email: 'mechanic@demo.com',
        password: 'mechanic123',
        role: 'mechanic',
        status: 'approved',
        phone: '+33 6 23 45 67 89',
        address: '456 Avenue du Mécanicien, 75002 Paris',
        contractType: 'monthly',
        baseSalary: 2500,
        commissionRate: 10,
        bankDetails: {
          iban: 'FR76 1234 5678 9012 3456 7890 123',
          bic: 'BNPAFRPP',
          bankName: 'BNP Paribas'
        }
      },
      {
        fullName: 'Manager Demo',
        email: 'manager@demo.com',
        password: 'manager123',
        role: 'manager',
        status: 'approved',
        phone: '+33 6 34 56 78 90',
        address: '789 Boulevard du Manager, 75003 Paris'
      }
    ];
    
    for (const userData of demoUsers) {
      const passwordHash = await bcrypt.hash(userData.password, 10);
      const user = new User({
        fullName: userData.fullName,
        email: userData.email,
        passwordHash,
        role: userData.role,
        status: userData.status,
        phone: userData.phone,
        address: userData.address,
        contractType: userData.contractType,
        baseSalary: userData.baseSalary,
        commissionRate: userData.commissionRate,
        bankDetails: userData.bankDetails
      });
      
      await user.save();
      console.log(`   ✅ ${user.fullName} créé (${user.role})`);
      if (user.role === 'mechanic') {
        console.log(`      - Contrat: ${user.contractType}`);
        console.log(`      - Salaire: ${user.baseSalary}€/mois`);
        console.log(`      - Commission: ${user.commissionRate}%`);
      }
    }
    
    // Vérification finale
    console.log('\n📊 État final de la base de données:');
    const finalUsers = await User.countDocuments();
    const finalVehicles = await Vehicle.countDocuments();
    const finalAppointments = await Appointment.countDocuments();
    const finalWorkOrders = await WorkOrder.countDocuments();
    
    console.log(`   - Utilisateurs: ${finalUsers} (3 utilisateurs démo)`);
    console.log(`   - Véhicules: ${finalVehicles}`);
    console.log(`   - Rendez-vous: ${finalAppointments}`);
    console.log(`   - Ordres de réparation: ${finalWorkOrders}`);
    
    console.log('\n✅ Nettoyage et réinitialisation terminés avec succès!');
    console.log('\n🔑 Identifiants de connexion:');
    console.log('   Client:    client@demo.com    / client123');
    console.log('   Mécanicien: mechanic@demo.com / mechanic123');
    console.log('   Manager:    manager@demo.com  / manager123');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion à la base de données fermée.');
  }
}

cleanDatabase();