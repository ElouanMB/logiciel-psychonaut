@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title Installation Automatique - Psychonaut Analyzer
color 0D

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
cls

REM Etape 1 : Verification/Installation Node.js
echo.
echo ========================================
echo   ETAPE 1/3 : NODE.JS
echo ========================================
echo.

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js n'est pas installe.
    echo Installation automatique en cours...
    echo.
    call "%~dp0scripts\check-nodejs.bat"
    if %errorlevel% neq 0 (
        echo.
        echo [ERREUR] Impossible d'installer Node.js automatiquement.
        echo Veuillez l'installer manuellement depuis https://nodejs.org/
        echo puis relancer ce script.
        pause
        exit /b 1
    )
    echo.
    echo [INFO] Node.js installe ! Veuillez fermer ce terminal
    echo        et relancer auto-setup.bat dans un nouveau terminal.
    pause
    exit /b 0
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js deja installe : !NODE_VERSION!
)

echo.
REM Etape 2 : Installation dependances
echo.
echo ========================================
echo   ETAPE 2/3 : DEPENDANCES
echo ========================================
echo.

echo Installation des dependances npm...
echo Cela peut prendre quelques minutes...
echo.

REM Verification de npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] npm n'est pas disponible.
    echo Veuillez reinstaller Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

REM Creation des dossiers necessaires
if not exist "config" mkdir config
if not exist "data" mkdir data

echo [INFO] Telechargement et installation des packages...
echo        Cette operation peut prendre 2-3 minutes selon votre connexion.
echo        Veuillez patienter...
echo.

REM Installation des dependances
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] L'installation des dependances a echoue.
    echo Verifiez votre connexion Internet et reessayez.
    pause
    exit /b 1
)

echo.
echo [OK] Dependances installees avec succes !

REM Etape 3 : Creation raccourci
echo.
echo ========================================
echo   ETAPE 3/3 : RACCOURCI BUREAU
echo ========================================
echo.

echo Creation du raccourci sur le bureau...
echo.

REM Executer directement le script PowerShell sans passer par create-shortcut.bat
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\create-shortcut.ps1"

if %errorlevel% neq 0 (
    echo.
    echo Tentative avec methode alternative...
    
    set SCRIPT_DIR=%CD%\
    set DESKTOP=%USERPROFILE%\Desktop
    set SHORTCUT_NAME=Psychonaut Analyzer
    
    powershell -Command "$WScriptShell = New-Object -ComObject WScript.Shell; $Shortcut = $WScriptShell.CreateShortcut('%DESKTOP%\%SHORTCUT_NAME%.lnk'); $Shortcut.TargetPath = '%SCRIPT_DIR%scripts\start.bat'; $Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; $Shortcut.IconLocation = '%SCRIPT_DIR%ressources\logo-site.ico'; $Shortcut.Description = 'Psychonaut Analyzer'; $Shortcut.Save()"
    
    if !errorlevel! equ 0 (
        echo.
        echo [OK] Raccourci cree avec succes !
    ) else (
        echo.
        echo [AVERTISSEMENT] Impossible de creer le raccourci automatiquement.
        echo Vous pouvez creer un raccourci manuellement vers scripts\start.bat
    )
) else (
    echo.
    echo [OK] Raccourci cree avec succes !
)

echo.
echo ========================================
echo   INSTALLATION TERMINEE !
echo ========================================
echo.
echo L'application est prete a l'emploi !
echo.
echo Pour lancer Psychonaut Analyzer :
echo   - Double-cliquez sur le raccourci bureau
echo   - Ou lancez scripts\start.bat
echo.
echo ========================================
echo.
pause
