@echo off
echo 🧪 Test Backend isolé...
echo.

cd backend

echo 📊 Test complet de tous les systèmes...
node test-all-systems.js

echo.
echo 🔧 Test du workflow des outils...
node test-tools-workflow.js

echo.
echo 📅 Test final du système workdays...
node final-test-workdays.js

echo.
echo 💰 Test du calcul des salaires...
node test-salary-calculation.js

echo.
echo ✅ Tests backend terminés !
pause

cd ..