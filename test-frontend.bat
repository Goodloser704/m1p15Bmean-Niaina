@echo off
echo 🧪 Test Frontend en mode développement...
echo.

cd frontend
echo 📦 Installation des dépendances (si nécessaire)...
npm install --silent

echo 🔍 Vérification des erreurs TypeScript...
npx ng build --dry-run

if %errorlevel% equ 0 (
    echo ✅ Pas d'erreurs TypeScript détectées !
    echo.
    echo 🚀 Démarrage du serveur de développement...
    npm start
) else (
    echo ❌ Erreurs TypeScript détectées !
    echo Corrigez les erreurs avant de continuer.
    pause
)

cd ..