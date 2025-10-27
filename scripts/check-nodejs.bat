@echo off
setlocal enabledelayedexpansion
title Verification et Installation de Node.js
color 0D

echo.
echo ========================================
echo   VERIFICATION DE NODE.JS
echo ========================================
echo.

REM Verification de Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js est deja installe : !NODE_VERSION!
    echo.
    echo Vous pouvez continuer avec l'installation.
    echo.
    pause
    exit /b 0
)

echo [INFO] Node.js n'est pas installe sur votre systeme.
echo.
echo Ce logiciel necessite Node.js pour fonctionner.
echo.
echo ========================================
echo   INSTALLATION AUTOMATIQUE
echo ========================================
echo.
echo Options :
echo   1. Telecharger et installer automatiquement (recommande)
echo   2. Ouvrir la page de telechargement manuel
echo   3. Annuler
echo.
set /p choice="Votre choix (1/2/3) : "

if "%choice%"=="1" goto :auto_install
if "%choice%"=="2" goto :manual_install
if "%choice%"=="3" goto :cancel

echo Choix invalide.
pause
exit /b 1

:auto_install
echo.
echo ========================================
echo   TELECHARGEMENT DE NODE.JS
echo ========================================
echo.
echo Detection de l'architecture systeme...

REM Detecter l'architecture (x64 ou x86)
set ARCH=x64
if "%PROCESSOR_ARCHITECTURE%"=="x86" (
    if not defined PROCESSOR_ARCHITEW6432 set ARCH=x86
)

echo Architecture detectee : %ARCH%
echo.

REM Version LTS actuelle (a mettre a jour periodiquement)
set NODE_VERSION=20.18.0
set INSTALLER_NAME=node-v%NODE_VERSION%-x64.msi
if "%ARCH%"=="x86" set INSTALLER_NAME=node-v%NODE_VERSION%-x86.msi

set DOWNLOAD_URL=https://nodejs.org/dist/v%NODE_VERSION%/%INSTALLER_NAME%
set TEMP_DIR=%TEMP%\nodejs-installer
set INSTALLER_PATH=%TEMP_DIR%\%INSTALLER_NAME%

echo URL de telechargement :
echo %DOWNLOAD_URL%
echo.
echo Telechargement en cours...
echo (Cela peut prendre quelques minutes selon votre connexion)
echo.

REM Creer le dossier temporaire
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

REM Telecharger avec PowerShell
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%INSTALLER_PATH%'; if ($?) { Write-Host '[OK] Telechargement termine !' -ForegroundColor Green } else { Write-Host '[ERREUR] Echec du telechargement' -ForegroundColor Red; exit 1 }}"

if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] Le telechargement a echoue.
    echo.
    echo Voulez-vous ouvrir la page de telechargement manuel ? (O/N)
    set /p manual="Reponse : "
    if /i "!manual!"=="O" goto :manual_install
    goto :cancel
)

echo.
echo ========================================
echo   INSTALLATION DE NODE.JS
echo ========================================
echo.
echo Lancement de l'installateur...
echo.
echo [INFO] Une fenetre d'installation va s'ouvrir.
echo        Suivez les instructions et acceptez les parametres par defaut.
echo        L'installation peut necessiter des droits administrateur.
echo.
pause

REM Lancer l'installateur MSI
start /wait msiexec /i "%INSTALLER_PATH%" /qn /norestart

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   INSTALLATION TERMINEE !
    echo ========================================
    echo.
    echo Node.js a ete installe avec succes.
    echo.
    echo [IMPORTANT] Vous devez FERMER et ROUVRIR ce terminal
    echo             pour que Node.js soit disponible.
    echo.
    echo Apres avoir rouvert un nouveau terminal, relancez
    echo scripts\install.bat pour continuer l'installation.
    echo.
    
    REM Nettoyer le fichier temporaire
    del "%INSTALLER_PATH%" >nul 2>&1
    
    pause
    exit /b 0
) else (
    echo.
    echo [ERREUR] L'installation a echoue ou a ete annulee.
    echo.
    echo Codes d'erreur possibles :
    echo   - Installation annulee par l'utilisateur
    echo   - Droits administrateur requis
    echo   - Probleme avec le fichier d'installation
    echo.
    pause
    exit /b 1
)

:manual_install
echo.
echo Ouverture de la page de telechargement Node.js...
start https://nodejs.org/
echo.
echo Telechargez et installez Node.js LTS (version recommandee).
echo Apres l'installation, relancez scripts\install.bat
echo.
pause
exit /b 1

:cancel
echo.
echo Installation annulee.
echo.
pause
exit /b 1
