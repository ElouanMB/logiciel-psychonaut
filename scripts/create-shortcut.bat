@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0.."
REM Script pour creer un raccourci avec icone personnalisee
REM A executer apres l'installation

echo.
echo ========================================
echo   CREATION DU RACCOURCI
echo ========================================
echo.
echo Creation du raccourci sur le bureau...
echo.

REM Executer le script PowerShell
powershell -ExecutionPolicy Bypass -File "%~dp0create-shortcut.ps1"

if %errorlevel% neq 0 (
    echo.
    echo Tentative avec methode alternative...
    
    set SCRIPT_DIR=%CD%\
    set DESKTOP=%USERPROFILE%\Desktop
    set SHORTCUT_NAME=Psychonaut Analyzer
    
    powershell -Command "$WScriptShell = New-Object -ComObject WScript.Shell; $Shortcut = $WScriptShell.CreateShortcut('%DESKTOP%\%SHORTCUT_NAME%.lnk'); $Shortcut.TargetPath = '%SCRIPT_DIR%scripts\start.bat'; $Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; $Shortcut.IconLocation = '%SCRIPT_DIR%ressources\logo-site.ico'; $Shortcut.Description = 'Psychonaut Analyzer'; $Shortcut.Save()"
    
    if !errorlevel! equ 0 (
        echo.
        echo Raccourci cree avec succes !
        echo.
    ) else (
        echo.
        echo Erreur : Impossible de creer le raccourci.
        echo Vous pouvez creer un raccourci manuellement vers scripts\start.bat
        echo.
    )
)

pause
