const mongoose = require('mongoose');
const User = require('./src/models/User');
const WorkDay = require('./src/models/WorkDay');
const WorkOrder = require('./src/models/WorkOrder');
const Appointment = require('./src/models/Appointment');
const Vehicle = require('./src/models/Vehicle');
const Tool = require('./src/models/Tool');
const ToolReservation = require('./src/models/ToolReservation');
const VatSettings = require('./src/models/VatSettings');
const Invoice = require('./src/models/Invoice');
const Garage = require('./src/models/Garage');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetAndSeedWorkdays() {
  try {
    console.log('🧹 NETTOYAGE ET CRÉATION DES DONNÉES DE TEST WORKDAYS\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 1. NETTOYER TOUTES LES DONNÉES
    console.log('🗑️  Suppression de toutes les données...');
    await Promise.all([
      User.deleteMany({}),
      WorkDay.deleteMany({}),
      WorkOrder.deleteMany({}),
      Appointment.deleteMany({}),
      Vehicle.deleteMany({}),
      Tool.deleteMany({}),
      ToolReservation.deleteMany({}),
      VatSettings.deleteMany({}),
      Invoice.deleteMany({}),
      Garage.deleteMany({})
    ]);
    console.log('✅ Toutes les données supprimées');
    
    // 2. CRÉER LES 4 UTILISATEURS DE BASE
    console.log('\n👥 Création des utilisateurs de base...');
    const clientPasswordHash = await bcrypt.hash('client123', 10);
    const mechanicPasswordHash = await bcrypt.hash('mechanic123', 10);
    const managerPasswordHash = await bcrypt.hash('manager123', 10);
    
    const users = [
      {
        fullName: 'Client Démo',
        email: 'client@demo.com',
        passwordHash: clientPasswordHash,
        role: 'client',
        status: 'approved',
        phone: '+33 6 01 02 03 04',
        address: '123 Rue du Client, 75001 Paris',
        city: 'Paris',
        postalCode: '75001',
        location: {
          address: '123 Rue du Client, 75001 Paris',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
          coordinates: {
            latitude: 48.8566,
            longitude: 2.3522
          }
        }
      },
      {
        fullName: 'Mécanicien Démo',
        email: 'mechanic@demo.com',
        passwordHash: mechanicPasswordHash,
        role: 'mechanic',
        status: 'approved',
        phone: '+33 6 05 06 07 08',
        address: '456 Avenue du Mécanicien, 75002 Paris',
        city: 'Paris',
        postalCode: '75002',
        contractType: 'monthly',
        baseSalary: 2500, // 2500€/mois
        commissionRate: 8, // 8% de commission
        bankDetails: 'FR76 1234 5678 9012 3456 7890 123',
        location: {
          address: '456 Avenue du Mécanicien, 75002 Paris',
          city: 'Paris',
          postalCode: '75002',
          country: 'France',
          coordinates: {
            latitude: 48.8566,
            longitude: 2.3522
          }
        }
      },
      {
        fullName: 'Manager Démo',
        email: 'manager@demo.com',
        passwordHash: managerPasswordHash,
        role: 'manager',
        status: 'approved',
        phone: '+33 6 09 10 11 12',
        address: '789 Boulevard du Manager, 75003 Paris',
        city: 'Paris',
        postalCode: '75003',
        location: {
          address: '789 Boulevard du Manager, 75003 Paris',
          city: 'Paris',
          postalCode: '75003',
          country: 'France',
          coordinates: {
            latitude: 48.8566,
            longitude: 2.3522
          }
        }
      }
    ];
    
    const createdUsers = await User.insertMany(users);
    console.log('✅ 4 utilisateurs créés');
    
    // 3. CRÉER DES MÉCANICIENS SUPPLÉMENTAIRES POUR TESTER LES WORKDAYS
    console.log('\n🔧 Création de mécaniciens de test...');
    const testMechanics = [
      {
        fullName: 'Jean Dupont',
        email: 'jean.dupont@garage.com',
        passwordHash: mechanicPasswordHash,
        role: 'mechanic',
        status: 'approved',
        phone: '+33 6 20 21 22 23',
        address: '100 Rue de la Mécanique, 75010 Paris',
        city: 'Paris',
        postalCode: '75010',
        contractType: 'daily',
        baseSalary: 120, // 120€/jour
        commissionRate: 10,
        bankDetails: 'FR76 1111 2222 3333 4444 5555 666',
        createdAt: new Date('2026-01-01'),
        location: {
          address: '100 Rue de la Mécanique, 75010 Paris',
          city: 'Paris',
          postalCode: '75010',
          country: 'France',
          coordinates: {
            latitude: 48.8566,
            longitude: 2.3522
          }
        }
      },
      {
        fullName: 'Marie Martin',
        email: 'marie.martin@garage.com',
        passwordHash: mechanicPasswordHash,
        role: 'mechanic',
        status: 'approved',
        phone: '+33 6 24 25 26 27',
        address: '200 Avenue des Outils, 75011 Paris',
        city: 'Paris',
        postalCode: '75011',
        contractType: 'monthly',
        baseSalary: 2800, // 2800€/mois
        commissionRate: 6,
        bankDetails: 'FR76 2222 3333 4444 5555 6666 777',
        createdAt: new Date('2025-12-15'),
        location: {
          address: '200 Avenue des Outils, 75011 Paris',
          city: 'Paris',
          postalCode: '75011',
          country: 'France',
          coordinates: {
            latitude: 48.8566,
            longitude: 2.3522
          }
        }
      },
      {
        fullName: 'Pierre Durand',
        email: 'pierre.durand@garage.com',
        passwordHash: mechanicPasswordHash,
        role: 'mechanic',
        status: 'approved',
        phone: '+33 6 28 29 30 31',
        address: '300 Boulevard des Réparations, 75012 Paris',
        city: 'Paris',
        postalCode: '75012',
        contractType: 'commission',
        baseSalary: 0,
        commissionRate: 25, // 25% commission uniquement
        bankDetails: 'FR76 3333 4444 5555 6666 7777 888',
        createdAt: new Date('2026-01-10'),
        location: {
          address: '300 Boulevard des Réparations, 75012 Paris',
          city: 'Paris',
          postalCode: '75012',
          country: 'France',
          coordinates: {
            latitude: 48.8566,
            longitude: 2.3522
          }
        }
      }
    ];
    
    const testMechanicsCreated = await User.insertMany(testMechanics);
    console.log('✅ 3 mécaniciens de test créés');
    
    // 4. CRÉER DES DÉCLARATIONS DE JOURS DE TRAVAIL
    console.log('\n📅 Création des déclarations de jours de travail...');
    
    const allMechanics = [...createdUsers.filter(u => u.role === 'mechanic'), ...testMechanicsCreated];
    const workDaysData = [];
    
    // Pour chaque mécanicien, créer des déclarations pour janvier 2026
    for (const mechanic of allMechanics) {
      console.log(`   📋 Déclarations pour ${mechanic.fullName}...`);
      
      // Jours de travail pour janvier 2026
      const januaryWorkDays = [
        { date: '2026-01-02', hours: 8, status: 'approved', notes: 'Première journée de l\'année' },
        { date: '2026-01-03', hours: 7.5, status: 'approved', notes: 'Formation matinale' },
        { date: '2026-01-06', hours: 8, status: 'approved', notes: 'Journée normale' },
        { date: '2026-01-07', hours: 8, status: 'approved', notes: 'Réparations diverses' },
        { date: '2026-01-08', hours: 6, status: 'approved', notes: 'Demi-journée inventaire' },
        { date: '2026-01-09', hours: 8, status: 'declared', notes: 'En attente validation' },
        { date: '2026-01-10', hours: 8, status: 'declared', notes: 'Travail sur gros chantier' },
        { date: '2026-01-13', hours: 8, status: 'declared', notes: 'Maintenance préventive' },
        { date: '2026-01-14', hours: 8, status: 'approved', notes: 'Diagnostic électronique' },
        { date: '2026-01-15', hours: 8, status: 'approved', notes: 'Réparation moteur' },
        { date: '2026-01-16', hours: 7, status: 'approved', notes: 'Formation sécurité' },
        { date: '2026-01-17', hours: 8, status: 'approved', notes: 'Contrôle qualité' },
        { date: '2026-01-20', hours: 8, status: 'declared', notes: 'Nouvelle semaine' },
        { date: '2026-01-21', hours: 8, status: 'declared', notes: 'Réparations urgentes' },
        { date: '2026-01-22', hours: 6, status: 'rejected', notes: 'Congé non autorisé', rejectionReason: 'Congé non planifié' },
        { date: '2026-01-23', hours: 8, status: 'approved', notes: 'Retour après congé' }
      ];
      
      for (const dayData of januaryWorkDays) {
        workDaysData.push({
          mechanicId: mechanic._id,
          date: new Date(dayData.date),
          hoursWorked: dayData.hours,
          status: dayData.status,
          notes: dayData.notes,
          declaredAt: new Date(dayData.date + 'T18:00:00Z'), // Déclaré le soir même
          ...(dayData.status === 'approved' && { 
            approvedBy: createdUsers.find(u => u.role === 'manager')._id,
            approvedAt: new Date(dayData.date + 'T20:00:00Z')
          }),
          ...(dayData.status === 'rejected' && { 
            approvedBy: createdUsers.find(u => u.role === 'manager')._id,
            approvedAt: new Date(dayData.date + 'T20:00:00Z'),
            rejectionReason: dayData.rejectionReason 
          })
        });
      }
    }
    
    await WorkDay.insertMany(workDaysData);
    console.log(`✅ ${workDaysData.length} déclarations créées`);
    
    // 5. CRÉER QUELQUES OUTILS
    console.log('\n🔧 Création des outils...');
    const tools = [
      {
        name: 'Clé à molette 24mm',
        category: 'Clés',
        isConsumable: false,
        totalQuantity: 5,
        availableQuantity: 5,
        description: 'Clé à molette professionnelle 24mm'
      },
      {
        name: 'Huile moteur 5W30',
        category: 'Consommables',
        isConsumable: true,
        totalQuantity: 20,
        availableQuantity: 20,
        description: 'Huile moteur synthétique 5W30 - 1L'
      },
      {
        name: 'Scanner OBD2',
        category: 'Diagnostic',
        isConsumable: false,
        totalQuantity: 2,
        availableQuantity: 2,
        description: 'Scanner de diagnostic OBD2 professionnel'
      }
    ];
    
    await Tool.insertMany(tools);
    console.log('✅ 3 outils créés');
    
    // 6. CRÉER DES PARAMÈTRES TVA
    console.log('\n💰 Création des paramètres TVA...');
    const vatSettings = [
      {
        taskKeywords: ['service', 'diagnostic', 'consultation'],
        vatRate: 20,
        description: 'Services de diagnostic et consultation'
      },
      {
        taskKeywords: ['pièce', 'part', 'composant'],
        vatRate: 20,
        description: 'Pièces neuves'
      },
      {
        taskKeywords: ['occasion', 'usagé', 'reconditionné'],
        vatRate: 10,
        description: 'Pièces d\'occasion'
      },
      {
        taskKeywords: ['handicap', 'pmr', 'accessibilité'],
        vatRate: 5.5,
        description: 'Adaptations pour personnes handicapées'
      }
    ];
    
    await VatSettings.insertMany(vatSettings);
    console.log('✅ Paramètres TVA créés');
    
    // 7. STATISTIQUES FINALES
    console.log('\n📊 STATISTIQUES DES DONNÉES CRÉÉES:');
    
    const stats = {
      users: await User.countDocuments(),
      mechanics: await User.countDocuments({ role: 'mechanic' }),
      workDays: await WorkDay.countDocuments(),
      approvedWorkDays: await WorkDay.countDocuments({ status: 'approved' }),
      pendingWorkDays: await WorkDay.countDocuments({ status: 'declared' }),
      rejectedWorkDays: await WorkDay.countDocuments({ status: 'rejected' }),
      tools: await Tool.countDocuments(),
      vatSettings: await VatSettings.countDocuments()
    };
    
    console.log(`   • Utilisateurs: ${stats.users} (dont ${stats.mechanics} mécaniciens)`);
    console.log(`   • Déclarations de jours: ${stats.workDays}`);
    console.log(`     - Approuvées: ${stats.approvedWorkDays}`);
    console.log(`     - En attente: ${stats.pendingWorkDays}`);
    console.log(`     - Rejetées: ${stats.rejectedWorkDays}`);
    console.log(`   • Outils: ${stats.tools}`);
    console.log(`   • Paramètres TVA: ${stats.vatSettings}`);
    
    console.log('\n🎯 COMPTES DE TEST:');
    console.log('   • Client: client@demo.com / client123');
    console.log('   • Mécanicien: mechanic@demo.com / mechanic123');
    console.log('   • Manager: manager@demo.com / manager123');
    console.log('   • Jean Dupont (journalier): jean.dupont@garage.com / mechanic123');
    console.log('   • Marie Martin (mensuel): marie.martin@garage.com / mechanic123');
    console.log('   • Pierre Durand (commission): pierre.durand@garage.com / mechanic123');
    
    console.log('\n🧪 POUR TESTER LES NOUVELLES FONCTIONNALITÉS:');
    console.log('   1. Connectez-vous en tant que mécanicien');
    console.log('   2. Allez dans "Mes Jours de Travail" pour voir/déclarer');
    console.log('   3. Allez dans "Mes Revenus" pour voir le calcul précis');
    console.log('   4. Connectez-vous en manager pour valider les déclarations');
    console.log('   5. Testez les différents types de contrats');
    
    console.log('\n✅ Base de données réinitialisée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée.');
  }
}

resetAndSeedWorkdays();