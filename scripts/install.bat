@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0.."
title Installation - Psychonaut Analyzer
color 0D

echo.
echo ========================================
echo   PSYCHONAUT ANALYZER - INSTALLATION
echo ========================================
echo.

REM Verification de Node.js
echo [1/4] Verification de Node.js...
call "%~dp0check-nodejs.bat"
if %errorlevel% neq 0 (
    echo.
    echo Node.js n'est pas disponible.
    echo Veuillez l'installer puis relancer ce script.
    pause
    exit /b 1
)

echo.

REM Verification de npm
echo [2/4] Verification de npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] npm n'est pas disponible.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo    npm detecte : v%NPM_VERSION%
echo.

REM Installation des dependances
echo [3/4] Installation des dependances...
echo    Cela peut prendre quelques minutes...
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] L'installation des dependances a echoue.
    pause
    exit /b 1
)

echo.
echo    Dependances installees avec succes !
echo.

REM Creation du dossier config s'il n'existe pas
if not exist "config" (
    mkdir config
)

REM Creation du dossier data s'il n'existe pas
if not exist "data" (
    mkdir data
)

REM Verification du .env
echo [4/4] Configuration...
if not exist "config\.env" (
    echo.
    echo [INFO] Fichier de configuration non trouve.
    echo Un fichier config\.env sera cree au premier lancement.
)

echo.
echo ========================================
echo   INSTALLATION TERMINEE AVEC SUCCES !
echo ========================================
echo.
echo Prochaines etapes :
echo.
echo 1. Double-cliquez sur "Psychonaut Analyzer.lnk" pour lancer l'application
echo    ^(ou executez scripts\start.bat^)
echo.
echo 2. Lors du premier lancement, configurez vos identifiants
echo    Psychonaut dans l'interface web
echo.
echo ========================================
echo.
pause
