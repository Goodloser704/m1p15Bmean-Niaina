# 🧪 Guide de Test Local

## 🚀 Démarrage Rapide

### Option 1: Démarrage Automatique
```bash
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

### Test Backend Complet
```bash
test-backend.bat
```

### Test Frontend Seul
```bash
test-frontend.bat
```

### Test Production Final
```bash
node test-production-final.js
```

## 📊 Tests Fonctionnels

### 1. Comptes de Test
- Client: `client@demo.com` / `client123`
- Mécanicien: `mechanic@demo.com` / `mechanic123`  
- Manager: `manager@demo.com` / `manager123`

### 2. Workflow Complet
1. **Client**: Créer rendez-vous
2. **Mécanicien**: Diagnostic → Estimation avec outils
3. **Client**: Approuver estimation
4. **Mécanicien**: Commencer → Terminer réparation
5. **Manager**: Marquer comme payé
6. **Mécanicien**: Vérifier revenus

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

## 📱 Test Mobile
```bash
# Démarrer avec IP locale
cd frontend
ng serve --host 0.0.0.0 --port 4200
```