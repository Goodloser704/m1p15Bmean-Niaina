# 🛠️ Guide des Scripts

## 🚀 Scripts de Démarrage

### `start-dev.bat`
Démarre automatiquement le backend et frontend en mode développement.
```bash
start-dev.bat
```

## 🧪 Scripts de Test

### `test-backend.bat`
Lance tous les tests backend essentiels :
- Test complet des systèmes
- Test du workflow des outils
- Test du système workdays
- Test du calcul des salaires

### `test-frontend.bat`
Vérifie et démarre le frontend avec validation TypeScript.

### `test-production-final.js`
Test complet de l'application en production (URLs Vercel/Render).

## 📊 Scripts Backend Spécialisés

### Tests et Vérifications
- `backend/test-all-systems.js` - Vue d'ensemble complète du système
- `backend/test-tools-workflow.js` - Test du système d'outils et consommables
- `backend/final-test-workdays.js` - Vérification du système de déclaration des jours
- `backend/test-salary-calculation.js` - Test des calculs de salaires

### Données et Initialisation
- `backend/clean-database.js` - Nettoie et réinitialise la base de données
- `backend/seed-test-data.js` - Génère des données de test pour les revenus
- `backend/seed-test-appointments.js` - Crée des rendez-vous pour tester la géolocalisation
- `backend/seed-tools-data.js` - Initialise l'inventaire d'outils
- `backend/reset-and-seed-workdays.js` - Crée des déclarations de jours de travail
- `backend/seed-monthly-earnings.js` - Génère des données pour tester les revenus mensuels

### Utilitaires
- `backend/list-tools.js` - Affiche l'inventaire des outils
- `backend/analyze-monthly-earnings.js` - Analyse détaillée des revenus mensuels
- `backend/add-madagascar-clients.js` - Ajoute des clients avec géolocalisation Madagascar
- `backend/init-production-db.js` - Initialise la base de données de production
- `backend/test-mongodb-connection.js` - Teste la connexion MongoDB

## 🎯 Workflow de Test Recommandé

1. **Développement local** :
   ```bash
   start-dev.bat
   ```

2. **Test backend complet** :
   ```bash
   test-backend.bat
   ```

3. **Test frontend** :
   ```bash
   test-frontend.bat
   ```

4. **Test production** :
   ```bash
   node test-production-final.js
   ```

## 🔧 Comptes de Test

- **Client** : `client@demo.com` / `client123`
- **Mécanicien** : `mechanic@demo.com` / `mechanic123`
- **Manager** : `manager@demo.com` / `manager123`

## 📱 URLs de Production

- **Frontend** : https://m1p15-bmean-niaina.vercel.app
- **Backend** : https://m1p15bmean-niaina-2.onrender.com
- **Base de données** : MongoDB Atlas

## 🧹 Nettoyage

Pour repartir à zéro :
```bash
cd backend
node clean-database.js
```