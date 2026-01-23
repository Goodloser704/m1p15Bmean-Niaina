@echo off
echo 🚀 Déploiement de l'application...

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

echo 📤 Commit et push vers Git...
git add .
git commit -m "Préparation déploiement - Configuration production et build"
git push

echo ✅ Déploiement terminé !
echo 🌐 Frontend: https://m1p15-bmean-niaina.vercel.app
echo 🔧 Backend: https://m1p15bmean-niaina-2.onrender.com

pause