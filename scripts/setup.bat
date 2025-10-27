@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0.."
title Installation Complete - Psychonaut Analyzer
color 0D

echo.
echo ========================================
echo   PSYCHONAUT ANALYZER
echo   INSTALLATION COMPLETE
echo ========================================
echo.
echo Ce script va :
echo   1. Verifier Node.js
echo   2. Installer les dependances
echo   3. Creer un raccourci sur le bureau
echo.
echo Appuyez sur une touche pour continuer...
pause >nul

REM Etape 1 : Installation
echo.
echo ========================================
echo   ETAPE 1/2 : INSTALLATION
echo ========================================
echo.

call scripts\install.bat
if %errorlevel% neq 0 (
    echo.
    echo Installation annulee ou echouee.
    pause
    exit /b 1
)

REM Etape 2 : Creation du raccourci
echo.
echo ========================================
echo   ETAPE 2/2 : RACCOURCI BUREAU
echo ========================================
echo.

call scripts\create-shortcut.bat

echo.
echo ========================================
echo   INSTALLATION TERMINEE !
echo ========================================
echo.
echo Vous pouvez maintenant lancer l'application via :
echo   - Le raccourci "Psychonaut Analyzer" sur votre bureau
echo   - Le fichier scripts\start.bat
echo.
echo Au premier lancement, configurez vos identifiants
echo Psychonaut dans l'interface web.
echo.
echo ========================================
echo.
pause
