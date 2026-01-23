# 🚗 Garage Management System - M1P15 BMEAN

Système de gestion de garage automobile avec déclaration des jours de travail et validation manager.

## 🌐 Application en Production

- **Frontend**: https://m1p15-bmean-niaina.vercel.app
- **Backend**: https://m1p15bmean-niaina-2.onrender.com

## 🧪 Comptes de Test

| Rôle | Email | Mot de passe | Type de contrat |
|------|-------|--------------|-----------------|
| Client | `client@demo.com` | `client123` | - |
| Manager | `manager@demo.com` | `manager123` | - |
| Mécanicien | `mechanic@demo.com` | `mechanic123` | Mensuel (2500€) |
| Mécanicien | `jean.dupont@garage.com` | `mechanic123` | Journalier (120€/jour) |
| Mécanicien | `marie.martin@garage.com` | `mechanic123` | Mensuel (2800€) |
| Mécanicien | `pierre.durand@garage.com` | `mechanic123` | Commission (25%) |

## 🎯 Nouvelles Fonctionnalités

### 📅 Système de Déclaration des Jours de Travail
- **Mécaniciens** : Déclarent leurs jours de présence avec calendrier interactif
- **Managers** : Valident ou rejettent les déclarations
- **Calcul précis** : Salaires basés sur les jours réellement travaillés et approuvés

### 💰 Calcul Avancé des Salaires
- **3 types de contrats** : Mensuel, Journalier, Commission uniquement
- **Prise en compte** : Weekends, jours fériés, mois partiels
- **Transparence** : Détail complet du calcul pour chaque mécanicien

### 🔧 Fonctionnalités Existantes
- Gestion des rendez-vous et réparations
- Système d'outils et inventaire
- Géolocalisation et clients proches
- Facturation avec TVA automatique
- Interface mobile responsive

## 🚀 Développement Local

### Prérequis
- Node.js 18+
- MongoDB (local ou Atlas)

### Installation
```bash
# Cloner le projet
git clone https://github.com/Goodloser704/m1p15Bmean-Niaina.git
cd m1p15Bmean-Niaina

# Installer les dépendances backend
cd backend
npm install

# Installer les dépendances frontend
cd ../frontend
npm install
```

### Configuration
```bash
# Backend - Copier et configurer .env
cd backend
cp .env.example .env
# Éditer .env avec vos paramètres
```

### Lancement
```bash
# Démarrage automatique (backend + frontend)
.\start-dev.bat

# Ou manuellement :
# Backend
cd backend && npm run dev

# Frontend (nouveau terminal)
cd frontend && npm start
```

### Scripts Utiles
```bash
# Réinitialiser la base avec données de test
cd backend && node reset-and-seed-workdays.js

# Tester le système workdays
cd backend && node final-test-workdays.js

# Build de production
cd frontend && npm run build

# Déploiement
.\deploy.bat
```

## 🏗️ Architecture

### Backend (Node.js + Express + MongoDB)
- **API REST** avec authentification JWT
- **Modèles** : Users, WorkDays, WorkOrders, Tools, etc.
- **Services** : SalaryService pour calculs avancés
- **Middleware** : Auth, validation, CORS

### Frontend (Angular 17)
- **Pages** : Dashboard, Workdays, Earnings, Tools, etc.
- **Services** : API calls avec intercepteurs
- **Composants** : Mobile-responsive avec thème mécanicien
- **Guards** : Protection des routes par rôle

### Base de Données
- **MongoDB Atlas** en production
- **Collections** : users, workdays, workorders, tools, etc.
- **Index** : Optimisés pour les requêtes fréquentes

## 📊 Données de Test

Le système contient :
- **6 utilisateurs** (1 client, 1 manager, 4 mécaniciens)
- **64 déclarations** de jours de travail (40 approuvées, 20 en attente, 4 rejetées)
- **3 outils** de test avec gestion des stocks
- **Paramètres TVA** configurés

## 🔄 Workflow Principal

1. **Mécanicien** déclare ses jours de travail
2. **Manager** valide ou rejette les déclarations
3. **Système** calcule automatiquement les salaires précis
4. **Mécanicien** consulte ses revenus détaillés

## 🛠️ Technologies

- **Backend** : Node.js, Express, MongoDB, JWT, bcrypt
- **Frontend** : Angular 17, TypeScript, RxJS
- **Déploiement** : Render (backend), Vercel (frontend)
- **Base de données** : MongoDB Atlas