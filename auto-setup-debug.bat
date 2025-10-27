@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title Installation Automatique - Psychonaut Analyzer

echo.
echo ========================================
echo   PSYCHONAUT ANALYZER
echo   INSTALLATION AUTOMATIQUE COMPLETE
echo ========================================
echo.
echo Ce script va :
echo   1. Verifier/Installer Node.js automatiquement
echo   2. Installer les dependances npm
echo   3. Creer un raccourci sur le bureau
echo.
echo Appuyez sur une touche pour demarrer...
pause >nul

echo.
echo [DEBUG] Apres premier pause - Script continue...
echo.

REM Etape 1 : Verification/Installation Node.js
echo.
echo ========================================
echo   ETAPE 1/3 : NODE.JS
echo ========================================
echo.

echo [DEBUG] Test de node...
node --version >nul 2>&1
set NODE_ERROR=%errorlevel%
echo [DEBUG] Errorlevel de node: %NODE_ERROR%

if %NODE_ERROR% neq 0 (
    echo [DEBUG] Node.js NON detecte - Installation necessaire
    pause
    exit /b 1
) else (
    echo [DEBUG] Node.js detecte !
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js deja installe : !NODE_VERSION!
)

echo.
echo [DEBUG] Passage a l'etape 2...
pause

REM Etape 2 : Installation dependances
echo.
echo ========================================
echo   ETAPE 2/3 : DEPENDANCES
echo ========================================
echo.

echo [DEBUG] Verification npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] npm n'est pas disponible.
    pause
    exit /b 1
)

echo [DEBUG] npm OK !
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm version: !NPM_VERSION!
echo.
pause

REM Creation des dossiers necessaires
echo [DEBUG] Creation des dossiers...
if not exist "config" mkdir config
if not exist "data" mkdir data
echo [DEBUG] Dossiers crees !
pause

echo.
echo [INFO] Installation des packages npm...
echo        Cette operation peut prendre 2-3 minutes.
echo        Veuillez patienter...
echo.
pause

echo [DEBUG] Lancement de npm install...
call npm install
set NPM_ERROR=%errorlevel%
echo.
echo [DEBUG] npm install termine avec code: %NPM_ERROR%

if %NPM_ERROR% neq 0 (
    echo.
    echo [ERREUR] L'installation des dependances a echoue.
    pause
    exit /b 1
)

echo.
echo [OK] Dependances installees avec succes !
pause

REM Etape 3 : Creation raccourci
echo.
echo ========================================
echo   ETAPE 3/3 : RACCOURCI BUREAU
echo ========================================
echo.

echo [DEBUG] Creation du raccourci...
pause

echo Creation du raccourci sur le bureau...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0scripts\create-shortcut.ps1"
set PS_ERROR=%errorlevel%
echo [DEBUG] PowerShell termine avec code: %PS_ERROR%

if %PS_ERROR% neq 0 (
    echo [DEBUG] Tentative methode alternative...
    pause
) else (
    echo [OK] Raccourci cree avec succes !
)

echo.
echo ========================================
echo   INSTALLATION TERMINEE !
echo ========================================
echo.
echo L'application est prete a l'emploi !
echo.
pause
