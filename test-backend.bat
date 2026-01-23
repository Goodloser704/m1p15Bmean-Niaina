@echo off
echo 🧪 Test Backend isolé...
echo.

cd backend

echo 📊 Test rapide de la base de données...
node quick-test.js

echo.
echo 🔧 Test du workflow des outils...
node test-tools-workflow.js

echo.
echo 📋 Liste des outils...
node list-tools.js

echo.
echo ✅ Tests backend terminés !
pause

cd ..