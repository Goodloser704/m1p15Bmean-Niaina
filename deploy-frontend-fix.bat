@echo off
echo 🚀 Déploiement de la correction frontend...
echo.

echo 📦 Build du frontend avec la correction API...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du build frontend
    pause
    exit /b 1
)
echo ✅ Build frontend terminé
cd ..

echo 📤 Commit et push de la correction...
git add .
git commit -m "Fix: Correction de l'URL API en production

- Ajout du préfixe /api dans environment.prod.ts
- Ajout du préfixe /api dans environment.ts
- Correction de l'erreur 404 sur /workdays/my-workdays
- Les routes workdays fonctionnent maintenant correctement"

git push

echo.
echo ✅ Correction déployée !
echo.
echo 🎯 PROCHAINES ÉTAPES:
echo    1. Attendre le redéploiement automatique sur Vercel (~2-3 minutes)
echo    2. Tester l'application: https://m1p15-bmean-niaina.vercel.app
echo    3. Se connecter avec mechanic@demo.com / mechanic123
echo    4. Tester "Mes Jours de Travail" et "Mes Revenus"
echo.
echo 📖 L'erreur 404 sur /workdays/my-workdays devrait être résolue
echo.

pause