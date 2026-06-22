@echo off
title Colonie Tchadienne - Serveur
echo =========================================
echo   COLONIE TCHADIENNE - Moanda ^& Mounana
echo =========================================
echo.
echo Demarrage du serveur...
echo L'application sera accessible sur : http://localhost:3000
echo.
echo Comptes :
echo   Admin   : admin@colonie-tchad.ga / admin123
echo   Bureau  : bureau@colonie-tchad.ga / bureau123
echo   Lecteur : lecteur@colonie-tchad.ga / viewer123
echo.
echo Portail citoyen : http://localhost:3000/portail
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur.
echo =========================================
echo.

cd /d "C:\Users\impri\IMPRIMERIE APK\colonie-tchadienne"

REM Attendre 3 secondes puis ouvrir le navigateur
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"

"C:\Program Files\nodejs\npm.cmd" run dev
pause
