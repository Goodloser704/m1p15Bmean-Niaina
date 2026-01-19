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
        address: '123 Rue de Rivoli, 75001 Paris',
        location: {
          address: '123 Rue de Rivoli',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
          coordinates: {
            latitude: 48.8606,
            longitude: 2.3376
          },
          source: 'manual'
        }
      },
      {
        fullName: 'Mechanic Demo',
        email: 'mechanic@demo.com',
        password: 'mechanic123',
        role: 'mechanic',
        status: 'approved',
        phone: '+33 6 23 45 67 89',
        address: '456 Avenue des Champs-Élysées, 75008 Paris',
        location: {
          address: '456 Avenue des Champs-Élysées',
          city: 'Paris',
          postalCode: '75008',
          country: 'France',
          coordinates: {
            latitude: 48.8698,
            longitude: 2.3076
          },
          source: 'manual'
        },
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
        fullName: 'Mechanic 2 Demo',
        email: 'mechanic2@demo.com',
        password: 'mechanic123',
        role: 'mechanic',
        status: 'approved',
        phone: '+33 6 34 56 78 90',
        address: '321 Rue de la République, 75003 Paris',
        location: {
          address: '321 Rue de la République',
          city: 'Paris',
          postalCode: '75003',
          country: 'France',
          coordinates: {
            latitude: 48.8634,
            longitude: 2.3639
          },
          source: 'manual'
        },
        contractType: 'commission',
        baseSalary: 0,
        commissionRate: 25,
        bankDetails: {
          iban: 'FR76 9876 5432 1098 7654 3210 987',
          bic: 'CREDFRPP',
          bankName: 'Crédit Agricole'
        }
      },
      {
        fullName: 'Manager Demo',
        email: 'manager@demo.com',
        password: 'manager123',
        role: 'manager',
        status: 'approved',
        phone: '+33 6 34 56 78 90',
        address: '789 Boulevard Saint-Germain, 75007 Paris',
        location: {
          address: '789 Boulevard Saint-Germain',
          city: 'Paris',
          postalCode: '75007',
          country: 'France',
          coordinates: {
            latitude: 48.8559,
            longitude: 2.3364
          },
          source: 'manual'
        }
      },
      // Clients supplémentaires pour tester la géolocalisation
      {
        fullName: 'Marie Dubois',
        email: 'marie.dubois@email.com',
        password: 'demo123',
        role: 'client',
        status: 'approved',
        phone: '+33 6 45 67 89 01',
        address: '15 Rue de la Paix, 75002 Paris',
        location: {
          address: '15 Rue de la Paix',
          city: 'Paris',
          postalCode: '75002',
          country: 'France',
          coordinates: {
            latitude: 48.8692,
            longitude: 2.3316
          },
          source: 'manual'
        }
      },
      {
        fullName: 'Pierre Martin',
        email: 'pierre.martin@email.com',
        password: 'demo123',
        role: 'client',
        status: 'approved',
        phone: '+33 6 56 78 90 12',
        address: '42 Avenue Montaigne, 75008 Paris',
        location: {
          address: '42 Avenue Montaigne',
          city: 'Paris',
          postalCode: '75008',
          country: 'France',
          coordinates: {
            latitude: 48.8656,
            longitude: 2.3087
          },
          source: 'manual'
        }
      },
      {
        fullName: 'Sophie Leroy',
        email: 'sophie.leroy@email.com',
        password: 'demo123',
        role: 'client',
        status: 'approved',
        phone: '+33 6 67 89 01 23',
        address: '78 Rue du Faubourg Saint-Honoré, 75008 Paris',
        location: {
          address: '78 Rue du Faubourg Saint-Honoré',
          city: 'Paris',
          postalCode: '75008',
          country: 'France',
          coordinates: {
            latitude: 48.8721,
            longitude: 2.3165
          },
          source: 'manual'
        }
      },
      {
        fullName: 'Jean Moreau',
        email: 'jean.moreau@email.com',
        password: 'demo123',
        role: 'client',
        status: 'approved',
        phone: '+33 6 78 90 12 34',
        address: '33 Place Vendôme, 75001 Paris',
        location: {
          address: '33 Place Vendôme',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
          coordinates: {
            latitude: 48.8673,
            longitude: 2.3291
          },
          source: 'manual'
        }
      },
      {
        fullName: 'Isabelle Petit',
        email: 'isabelle.petit@email.com',
        password: 'demo123',
        role: 'client',
        status: 'approved',
        phone: '+33 6 89 01 23 45',
        address: '91 Rue de Rivoli, 75004 Paris',
        location: {
          address: '91 Rue de Rivoli',
          city: 'Paris',
          postalCode: '75004',
          country: 'France',
          coordinates: {
            latitude: 48.8570,
            longitude: 2.3522
          },
          source: 'manual'
        }
      },
      {
        fullName: 'Thomas Roux',
        email: 'thomas.roux@email.com',
        password: 'demo123',
        role: 'client',
        status: 'approved',
        phone: '+33 6 90 12 34 56',
        address: '67 Boulevard Haussmann, 75008 Paris',
        location: {
          address: '67 Boulevard Haussmann',
          city: 'Paris',
          postalCode: '75008',
          country: 'France',
          coordinates: {
            latitude: 48.8738,
            longitude: 2.3154
          },
          source: 'manual'
        }
      },
      {
        fullName: 'Camille Blanc',
        email: 'camille.blanc@email.com',
        password: 'demo123',
        role: 'client',
        status: 'approved',
        phone: '+33 6 01 23 45 67',
        address: '25 Rue Saint-Antoine, 75004 Paris',
        location: {
          address: '25 Rue Saint-Antoine',
          city: 'Paris',
          postalCode: '75004',
          country: 'France',
          coordinates: {
            latitude: 48.8553,
            longitude: 2.3626
          },
          source: 'manual'
        }
      },
      {
        fullName: 'Nicolas Garnier',
        email: 'nicolas.garnier@email.com',
        password: 'demo123',
        role: 'client',
        status: 'approved',
        phone: '+33 6 12 34 56 78',
        address: '156 Boulevard Saint-Germain, 75006 Paris',
        location: {
          address: '156 Boulevard Saint-Germain',
          city: 'Paris',
          postalCode: '75006',
          country: 'France',
          coordinates: {
            latitude: 48.8540,
            longitude: 2.3376
          },
          source: 'manual'
        }
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
        location: userData.location,
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
    
    console.log(`   - Utilisateurs: ${finalUsers} (10 utilisateurs démo avec géolocalisation)`);
    console.log(`   - Véhicules: ${finalVehicles}`);
    console.log(`   - Rendez-vous: ${finalAppointments}`);
    console.log(`   - Ordres de réparation: ${finalWorkOrders}`);
    
    console.log('\n✅ Nettoyage et réinitialisation terminés avec succès!');
    console.log('\n🔑 Identifiants de connexion:');
    console.log('   Client:       client@demo.com     / client123');
    console.log('   Mécanicien 1: mechanic@demo.com   / mechanic123');
    console.log('   Mécanicien 2: mechanic2@demo.com  / mechanic123');
    console.log('   Manager:      manager@demo.com    / manager123');
    console.log('\n🗺️  Clients avec géolocalisation:');
    console.log('   - Client Demo (Rue de Rivoli)');
    console.log('   - Marie Dubois (Rue de la Paix)');
    console.log('   - Pierre Martin (Avenue Montaigne)');
    console.log('   - Sophie Leroy (Faubourg Saint-Honoré)');
    console.log('   - Jean Moreau (Place Vendôme)');
    console.log('   - Isabelle Petit (Rue de Rivoli)');
    console.log('   - Thomas Roux (Boulevard Haussmann)');
    console.log('   - Camille Blanc (Rue Saint-Antoine)');
    console.log('   - Nicolas Garnier (Boulevard Saint-Germain)');
    console.log('\n📍 Testez "Clients Proches" avec le compte mécanicien!');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion à la base de données fermée.');
  }
}

cleanDatabase();