# 🚀 Guide de Déploiement Production - Garage Management System

## 📋 Architecture de Déploiement

- **Frontend** : Vercel (https://m1p15-bmean-niaina.vercel.app)
- **Backend** : Render (https://m1p15bmean-niaina-2.onrender.com)
- **Base de données** : MongoDB Atlas

## 🗄️ Configuration MongoDB Atlas

### Informations de connexion :
- **Utilisateur** : `faustresilient_db_user`
- **Mot de passe** : `NjpL9dxRHG7I0Bdn`
- **Cluster** : `cluster0.9fmmkpa.mongodb.net`
- **Base de données** : `m1p12mean_garage`

### URI complète :
```
mongodb+srv://faustresilient_db_user:NjpL9dxRHG7I0Bdn@cluster0.9fmmkpa.mongodb.net/m1p12mean_garage?retryWrites=true&w=majority
```

## 🔧 Configuration Backend (Render)

### Variables d'environnement à configurer dans Render :

1. **MONGODB_URI**
   ```
   mongodb+srv://faustresilient_db_user:NjpL9dxRHG7I0Bdn@cluster0.9fmmkpa.mongodb.net/m1p12mean_garage?retryWrites=true&w=majority
   ```

2. **CORS_ORIGIN**
   ```
   https://m1p15-bmean-niaina.vercel.app
   ```

3. **JWT_SECRET**
   ```
   m1p15bmean-garage-jwt-secret-2026-workdays-system-production
   ```

4. **JWT_EXPIRES_IN**
   ```
   7d
   ```

5. **NODE_ENV**
   ```
   production
   ```

### Configuration Render :
- **Root Directory** : `backend`
- **Build Command** : `npm install`
- **Start Command** : `npm start`

## 🌐 Configuration Frontend (Vercel)

### Domaines configurés :
- `m1p15-bmean-niaina.vercel.app` (principal)
- `m1p15-bmean-niaina-git-main-neros-projects-629366ad.vercel.app`
- `m1p15-bmean-niaina-cakwq06ij-neros-projects-629366ad.vercel.app`

### Configuration Vercel :

1. **Root Directory** : `frontend`

2. **Build & Development Settings** :
   - **Output Directory** : `dist/m1p12mean-xxx-yyy/browser`
   - **Build Command** : `npm run build`
   - **Install Command** : `npm install`

3. **Variables d'environnement** (optionnel) :
   - Aucune variable nécessaire (l'URL backend est dans environment.prod.ts)

## 🧪 Comptes de Test

| Rôle | Email | Mot de passe | Description |
|------|-------|--------------|-------------|
| Client | `client@demo.com` | `client123` | Compte client de démonstration |
| Manager | `manager@demo.com` | `manager123` | Compte manager pour validation |
| Mécanicien | `mechanic@demo.com` | `mechanic123` | Mécanicien mensuel (2500€) |
| Mécanicien | `jean.dupont@garage.com` | `mechanic123` | Mécanicien journalier (120€/jour) |
| Mécanicien | `marie.martin@garage.com` | `mechanic123` | Mécanicien mensuel (2800€) |
| Mécanicien | `pierre.durand@garage.com` | `mechanic123` | Mécanicien commission (25%) |

## 📝 Étapes de Déploiement

### 1. Préparation du Code

```bash
# Build du frontend
cd frontend
npm run build

# Commit et push
git add .
git commit -m "Configuration production avec MongoDB Atlas"
git push
```

### 2. Configuration Render (Backend)

1. Aller sur https://render.com
2. Connecter le repository GitHub
3. Créer un nouveau Web Service
4. Configurer :
   - **Root Directory** : `backend`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
5. Ajouter les variables d'environnement (voir section ci-dessus)
6. Déployer

### 3. Configuration Vercel (Frontend)

1. Aller sur https://vercel.com
2. Importer le projet depuis GitHub
3. Configurer :
   - **Root Directory** : `frontend`
   - **Output Directory** : `dist/m1p12mean-xxx-yyy/browser`
4. Déployer

### 4. Initialisation de la Base de Données

Exécuter le script d'initialisation :
```bash
node backend/init-production-db.js
```

## 🧪 Tests de Validation

### 1. Test des URLs
```bash
node test-production-login.js
```

### 2. Test de l'API
```bash
node test-backend-api.js
```

### 3. Test Manuel
1. Ouvrir https://m1p15-bmean-niaina.vercel.app
2. Se connecter avec `mechanic@demo.com / mechanic123`
3. Tester "Mes Jours de Travail"
4. Tester "Mes Revenus"
5. Se connecter en manager pour valider les déclarations

## 🎯 Fonctionnalités à Tester

### Système de Déclaration des Jours de Travail
- ✅ Déclaration par le mécanicien
- ✅ Validation par le manager
- ✅ Calcul précis des salaires
- ✅ Différents types de contrats

### Fonctionnalités Existantes
- ✅ Authentification et autorisation
- ✅ Gestion des rendez-vous
- ✅ Système d'outils
- ✅ Géolocalisation
- ✅ Facturation avec TVA
- ✅ Interface mobile responsive

## 🔍 Dépannage

### Backend ne démarre pas
1. Vérifier les variables d'environnement dans Render
2. Vérifier les logs Render
3. Tester la connexion MongoDB Atlas

### Frontend ne se charge pas
1. Vérifier la configuration Vercel
2. Vérifier l'Output Directory
3. Vérifier les logs de build

### Erreurs CORS
1. Vérifier CORS_ORIGIN dans Render
2. S'assurer qu'il n'y a pas de slash final
3. Vérifier que l'URL Vercel est correcte

### Base de données vide
1. Exécuter le script d'initialisation
2. Vérifier la connexion MongoDB Atlas
3. Vérifier les permissions IP dans Atlas

## 📊 Monitoring

### URLs de Monitoring
- **Frontend** : https://m1p15-bmean-niaina.vercel.app
- **Backend Health** : https://m1p15bmean-niaina-2.onrender.com/health
- **Backend API** : https://m1p15bmean-niaina-2.onrender.com/api/auth/login

### Logs
- **Render** : Dashboard Render > Logs
- **Vercel** : Dashboard Vercel > Functions > Logs
- **MongoDB** : Atlas Dashboard > Monitoring

## 🚀 Mise en Production

Une fois tous les tests validés :
1. ✅ Backend déployé sur Render
2. ✅ Frontend déployé sur Vercel
3. ✅ Base de données initialisée sur Atlas
4. ✅ Comptes de test créés
5. ✅ Fonctionnalités testées

L'application est prête pour la production ! 🎉