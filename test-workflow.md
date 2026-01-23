# 🧪 Guide de Test Local

## 🚀 Démarrage Rapide

### Option 1: Démarrage Automatique
```bash
# Double-cliquez sur start-dev.bat
# Ou exécutez dans le terminal:
start-dev.bat
```

### Option 2: Démarrage Manuel
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm start
```

## 🔍 Tests Spécifiques

### Test Backend Seul
```bash
# Exécuter test-backend.bat ou:
cd backend
node quick-test.js           # Test général
node test-tools-workflow.js  # Test workflow outils
node list-tools.js          # Liste inventaire
```

### Test Frontend Seul
```bash
# Exécuter test-frontend.bat ou:
cd frontend
ng serve --open
```

### Vérification TypeScript
```bash
cd frontend
ng build --dry-run  # Vérification sans build
ng lint             # Vérification du code
```

## 📊 Tests Fonctionnels

### 1. Test Utilisateurs
- Connexion: `client@demo.com` / `client123`
- Connexion: `mechanic@demo.com` / `mechanic123`  
- Connexion: `manager@demo.com` / `manager123`

### 2. Test Workflow Complet
1. **Client**: Créer rendez-vous
2. **Mécanicien**: Diagnostic → Estimation avec outils
3. **Client**: Approuver estimation
4. **Mécanicien**: Commencer → Terminer réparation
5. **Manager**: Marquer comme payé
6. **Mécanicien**: Vérifier revenus

### 3. Test Outils
1. **Manager**: Ajouter/modifier outils
2. **Mécanicien**: Sélectionner outils dans estimation
3. **Système**: Vérifier réservation automatique
4. **Mécanicien**: Terminer réparation
5. **Système**: Vérifier retour outils/consommation

## 🛠️ Dépannage

### Problèmes Courants
```bash
# Port déjà utilisé
netstat -ano | findstr :3000
netstat -ano | findstr :4200

# Nettoyer les processus
taskkill /PID <PID> /F

# Réinstaller dépendances
cd backend && npm install
cd frontend && npm install

# Reset base de données
cd backend && node clean-database.js
```

### Logs Utiles
- Backend: Console du serveur Node.js
- Frontend: Console navigateur (F12)
- Base de données: Logs MongoDB

## 📱 Test Mobile
```bash
# Démarrer avec IP locale
cd frontend
ng serve --host 0.0.0.0 --port 4200

# Accéder depuis mobile: http://[VOTRE_IP]:4200
```

## 🔄 Cycle de Développement

1. **Modifier le code**
2. **Test automatique** (hot reload)
3. **Vérifier console** (erreurs)
4. **Test fonctionnel** (interface)
5. **Commit** seulement si tout fonctionne

## 💡 Conseils

- Utilisez les **scripts de test** avant chaque commit
- Gardez les **consoles ouvertes** pour voir les erreurs
- Testez sur **différents navigateurs**
- Vérifiez la **base de données** avec les scripts
- Utilisez **Postman** pour tester les API directement