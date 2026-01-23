@echo off
echo 🚀 Déploiement Production - Garage Management System
echo.

echo 📋 Configuration:
echo    Frontend: https://m1p15-bmean-niaina.vercel.app
echo    Backend:  https://m1p15bmean-niaina-2.onrender.com
echo    Database: MongoDB Atlas (cluster0.9fmmkpa.mongodb.net)
echo.

echo 📦 Build du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du build frontend
    pause
    exit /b 1
)
echo ✅ Build frontend terminé
cd ..

echo 🧪 Test de la base de données...
node backend/test-mongodb-connection.js

echo 📤 Commit et push vers Git...
git add .
git commit -m "Configuration finale pour déploiement production

- MongoDB Atlas configuré avec faustresilient_db_user
- Base de données initialisée avec 6 utilisateurs de test
- 64 déclarations de jours de travail pour tests
- Guide de déploiement complet créé
- URLs Vercel et Render configurées"

git push

echo.
echo ✅ Déploiement préparé !
echo.
echo 🎯 PROCHAINES ÉTAPES:
echo    1. Configurer les variables d'environnement dans Render:
echo       - MONGODB_URI: mongodb+srv://faustresilient_db_user:NjpL9dxRHG7I0Bdn@cluster0.9fmmkpa.mongodb.net/m1p12mean_garage?retryWrites=true^&w=majority
echo       - CORS_ORIGIN: https://m1p15-bmean-niaina.vercel.app
echo       - JWT_SECRET: m1p15bmean-garage-jwt-secret-2026-workdays-system-production
echo.
echo    2. Configurer Vercel:
echo       - Root Directory: frontend
echo       - Output Directory: dist/m1p12mean-xxx-yyy/browser
echo.
echo    3. Tester l'application:
echo       - Frontend: https://m1p15-bmean-niaina.vercel.app
echo       - Comptes: mechanic@demo.com / mechanic123
echo.
echo 📖 Voir GUIDE-DEPLOIEMENT-PRODUCTION.md pour les détails complets
echo.

pause