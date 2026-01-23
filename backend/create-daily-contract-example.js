const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createDailyContractExample() {
  try {
    console.log('👷 Création d\'un exemple de contrat journalier...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Créer un mécanicien avec contrat journalier
    const passwordHash = await bcrypt.hash('mechanic123', 10);
    
    const dailyMechanic = new User({
      fullName: 'Mécanicien Journalier',
      email: 'mechanic.daily@demo.com',
      passwordHash,
      role: 'mechanic',
      status: 'approved',
      phone: '+33 6 11 22 33 44',
      address: '123 Rue du Travail, 75001 Paris',
      location: {
        address: '123 Rue du Travail',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
        coordinates: {
          latitude: 48.8566,
          longitude: 2.3522
        },
        source: 'manual'
      },
      contractType: 'daily',
      baseSalary: 120, // 120€ par jour
      commissionRate: 15, // 15% de commission
      bankDetails: {
        iban: 'FR76 1111 2222 3333 4444 5555 666',
        bic: 'TESTFRPP',
        bankName: 'Banque Test'
      }
    });
    
    await dailyMechanic.save();
    
    console.log('✅ Mécanicien journalier créé:');
    console.log(`   - Nom: ${dailyMechanic.fullName}`);
    console.log(`   - Email: ${dailyMechanic.email}`);
    console.log(`   - Contrat: ${dailyMechanic.contractType}`);
    console.log(`   - Salaire journalier: ${dailyMechanic.baseSalary}€/jour`);
    console.log(`   - Commission: ${dailyMechanic.commissionRate}%`);
    
    console.log('\n📊 SIMULATION CALCUL MENSUEL:');
    console.log('┌─────────────────┬─────────────┬─────────────┬─────────────┐');
    console.log('│ Mois            │ Jours Ouvrés│ Salaire Base│ Exemple     │');
    console.log('├─────────────────┼─────────────┼─────────────┼─────────────┤');
    console.log('│ Décembre 2025   │          22 │    2640.00€ │ 22×120€     │');
    console.log('│ Janvier 2026    │          21 │    2520.00€ │ 21×120€     │');
    console.log('│ Février 2026    │          20 │    2400.00€ │ 20×120€     │');
    console.log('└─────────────────┴─────────────┴─────────────┴─────────────┘');
    
    console.log('\n💡 DIFFÉRENCES AVEC LE CONTRAT MENSUEL:');
    console.log('• Contrat MENSUEL: Salaire fixe peu importe le nombre de jours');
    console.log('• Contrat JOURNALIER: Salaire varie selon les jours ouvrés du mois');
    console.log('• Février (20 jours) = moins payé que janvier (21 jours)');
    console.log('• Congés non payés = réduction du salaire');
    
    console.log('\n🧪 POUR TESTER:');
    console.log('1. Connectez-vous avec: mechanic.daily@demo.com / mechanic123');
    console.log('2. Créez quelques réparations pour ce mécanicien');
    console.log('3. Comparez les revenus avec les autres mécaniciens');
    console.log('4. Observez la différence de calcul selon le type de contrat');
    
  } catch (error) {
    if (error.code === 11000) {
      console.log('ℹ️  Le mécanicien journalier existe déjà.');
    } else {
      console.error('❌ Erreur:', error.message);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée.');
  }
}

createDailyContractExample();