const mongoose = require('mongoose');
const User = require('./src/models/User');
const WorkDay = require('./src/models/WorkDay');
const Tool = require('./src/models/Tool');
const VatSettings = require('./src/models/VatSettings');
const bcrypt = require('bcryptjs');

// Configuration pour MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://faustresilient_db_user:NjpL9dxRHG7I0Bdn@cluster0.9fmmkpa.mongodb.net/m1p12mean_garage?retryWrites=true&w=majority';

async function initProductionDB() {
  try {
    console.log('🚀 INITIALISATION DE LA BASE DE DONNÉES PRODUCTION\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB Atlas établie');
    
    // Vérifier si des données existent déjà
    const userCount = await User.countDocuments();
    console.log(`📊 Utilisateurs existants: ${userCount}`);
    
    if (userCount > 0) {
      console.log('ℹ️  Base de données déjà initialisée');
      
      // Afficher les utilisateurs existants
      const users = await User.find({}).select('fullName email role');
      console.log('\n👥 UTILISATEURS EXISTANTS:');
      users.forEach(user => {
        const roleIcon = {
          'client': '👤',
          'mechanic': '🔧',
          'manager': '👔'
        }[user.role] || '❓';
        console.log(`   ${roleIcon} ${user.fullName} (${user.email})`);
      });
      
    } else {
      console.log('🔄 Initialisation des données...');
      
      // Créer les utilisateurs de base
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
          baseSalary: 2500,
          commissionRate: 8,
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
          baseSalary: 120,
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
        }
      ];
      
      const createdUsers = await User.insertMany(users);
      console.log(`✅ ${createdUsers.length} utilisateurs créés`);
      
      // Créer quelques déclarations de test
      const mechanics = createdUsers.filter(u => u.role === 'mechanic');
      const manager = createdUsers.find(u => u.role === 'manager');
      
      const workDaysData = [];
      
      for (const mechanic of mechanics) {
        // Quelques déclarations pour janvier 2026
        const declarations = [
          { date: '2026-01-02', hours: 8, status: 'approved', notes: 'Première journée' },
          { date: '2026-01-03', hours: 7.5, status: 'approved', notes: 'Formation' },
          { date: '2026-01-06', hours: 8, status: 'approved', notes: 'Journée normale' },
          { date: '2026-01-07', hours: 8, status: 'declared', notes: 'En attente validation' },
          { date: '2026-01-08', hours: 6, status: 'declared', notes: 'Demi-journée' }
        ];
        
        for (const decl of declarations) {
          workDaysData.push({
            mechanicId: mechanic._id,
            date: new Date(decl.date),
            hoursWorked: decl.hours,
            status: decl.status,
            notes: decl.notes,
            declaredAt: new Date(decl.date + 'T18:00:00Z'),
            ...(decl.status === 'approved' && { 
              approvedBy: manager._id,
              approvedAt: new Date(decl.date + 'T20:00:00Z')
            })
          });
        }
      }
      
      await WorkDay.insertMany(workDaysData);
      console.log(`✅ ${workDaysData.length} déclarations créées`);
      
      // Créer des outils de base
      const tools = [
        {
          name: 'Clé à molette 24mm',
          category: 'Clés',
          isConsumable: false,
          totalQuantity: 5,
          availableQuantity: 5,
          description: 'Clé à molette professionnelle'
        },
        {
          name: 'Huile moteur 5W30',
          category: 'Consommables',
          isConsumable: true,
          totalQuantity: 20,
          availableQuantity: 20,
          description: 'Huile moteur synthétique'
        }
      ];
      
      await Tool.insertMany(tools);
      console.log(`✅ ${tools.length} outils créés`);
      
      // Créer les paramètres TVA
      const vatSettings = [
        {
          taskKeywords: ['service', 'diagnostic'],
          vatRate: 20,
          description: 'Services'
        },
        {
          taskKeywords: ['pièce', 'part'],
          vatRate: 20,
          description: 'Pièces neuves'
        }
      ];
      
      await VatSettings.insertMany(vatSettings);
      console.log(`✅ ${vatSettings.length} paramètres TVA créés`);
    }
    
    // Statistiques finales
    const stats = {
      users: await User.countDocuments(),
      workDays: await WorkDay.countDocuments(),
      tools: await Tool.countDocuments(),
      vatSettings: await VatSettings.countDocuments()
    };
    
    console.log('\n📊 STATISTIQUES FINALES:');
    console.log(`   • Utilisateurs: ${stats.users}`);
    console.log(`   • Déclarations: ${stats.workDays}`);
    console.log(`   • Outils: ${stats.tools}`);
    console.log(`   • Paramètres TVA: ${stats.vatSettings}`);
    
    console.log('\n🎯 COMPTES DE TEST:');
    console.log('   • Client: client@demo.com / client123');
    console.log('   • Manager: manager@demo.com / manager123');
    console.log('   • Mécanicien: mechanic@demo.com / mechanic123');
    console.log('   • Jean Dupont: jean.dupont@garage.com / mechanic123');
    
    console.log('\n✅ Base de données production initialisée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée.');
  }
}

initProductionDB();