@echo off
echo 🚀 Démarrage de l'environnement de développement...
echo.

echo 📊 Démarrage du backend...
start "Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo 🌐 Démarrage du frontend...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo ✅ Serveurs démarrés !
echo 📱 Frontend: http://localhost:4200
echo 🔧 Backend: http://localhost:3000
echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause >nul