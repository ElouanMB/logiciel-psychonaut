# Script PowerShell pour créer un raccourci avec icône
# Psychonaut Analyzer

param(
    [string]$DesktopPath = [Environment]::GetFolderPath("Desktop")
)

$ScriptDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ShortcutName = "Psychonaut Analyzer.lnk"
$ShortcutPath = Join-Path $DesktopPath $ShortcutName

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CREATION DU RACCOURCI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Créer l'objet WScript Shell
$WScriptShell = New-Object -ComObject WScript.Shell

# Créer le raccourci
$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = Join-Path $ScriptDir "scripts\start.bat"
$Shortcut.WorkingDirectory = $ScriptDir
$Shortcut.Description = "Psychonaut Analyzer - Outil d'analyse de substances"
$Shortcut.WindowStyle = 1  # Normal window

# Tenter d'utiliser l'icône (ICO uniquement supporté par Windows)
$IconPathIco = Join-Path $ScriptDir "ressources\logo-site.ico"
$IconPathPng = Join-Path $ScriptDir "ressources\logo-site.png"

if (Test-Path $IconPathIco) {
    $Shortcut.IconLocation = $IconPathIco
    Write-Host "[OK] Icone .ico trouvee : $IconPathIco" -ForegroundColor Green
} elseif (Test-Path $IconPathPng) {
    # PNG ne fonctionne pas vraiment pour les raccourcis, utiliser l'icône par défaut
    Write-Host "[INFO] Fichier PNG trouve mais non supporte pour les raccourcis" -ForegroundColor Yellow
    Write-Host "      Utilisez un fichier .ico pour une icone personnalisee" -ForegroundColor Yellow
    Write-Host "      Icone par defaut utilisee pour le moment" -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Aucune icone trouvee, icone par defaut utilisee" -ForegroundColor Yellow
}

# Sauvegarder le raccourci
try {
    $Shortcut.Save()
    Write-Host ""
    Write-Host "[SUCCES] Raccourci cree sur le bureau !" -ForegroundColor Green
    Write-Host "Nom : $ShortcutName" -ForegroundColor White
    Write-Host "Emplacement : $ShortcutPath" -ForegroundColor White
    Write-Host ""
    Write-Host "Vous pouvez maintenant double-cliquer sur ce raccourci" -ForegroundColor Cyan
    Write-Host "pour lancer Psychonaut Analyzer." -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "[ERREUR] Impossible de creer le raccourci" -ForegroundColor Red
    Write-Host "Details : $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Vous pouvez creer un raccourci manuellement vers :" -ForegroundColor Yellow
    Write-Host "  $ScriptDir\scripts\start.bat" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Appuyez sur Entree pour continuer"
