@echo off
setlocal
cd /d "%~dp0.."
title Psychonaut Analyzer
color 0D

REM Verification que node_modules existe
if not exist "node_modules\" (
    echo.
    echo [ERREUR] Les dependances ne sont pas installees.
    echo Veuillez d'abord executer scripts\install.bat
    echo.
    pause
    exit /b 1
)

REM Affichage du logo
echo.
echo ========================================
echo      PSYCHONAUT ANALYZER v1.0
echo ========================================
echo.
echo Demarrage du serveur...
echo.

REM Verification si le port 3000 est deja utilise
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [AVERTISSEMENT] Le port 3000 est deja utilise.
    echo Une instance est peut-etre deja en cours d'execution.
    echo.
    echo Ouverture du navigateur...
    timeout /t 2 >nul
    start http://localhost:3000
    echo.
    echo Si la page ne s'affiche pas, fermez l'autre instance
    echo et relancez cette application.
    echo.
    pause
    exit /b 0
)

REM Ouverture du navigateur apres 3 secondes
start "" cmd /c "timeout /t 3 >nul & start http://localhost:3000"

REM Lancement du serveur
echo Serveur demarre sur http://localhost:3000
echo.
echo [INFO] Pour arreter le serveur, fermez cette fenetre
echo        ou appuyez sur Ctrl+C
echo.
echo ========================================
echo.

node server.js

REM Si le serveur s'arrete avec une erreur
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo [ERREUR] Le serveur s'est arrete de maniere inattendue
    echo ========================================
    echo.
    pause
)
