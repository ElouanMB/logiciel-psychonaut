# 📦 Guide d'Installation - Psychonaut Analyzer

## 🚀 Installation en 2 Étapes !

### Étape 1 : Télécharger le projet

**Option A - Avec Git (recommandé)**
```bash
git clone https://github.com/ElouanMB/logiciel-psychonaut.git
```
git doit être installé sur la machine pour cette méthode

**Option B - Sans Git**
1. Aller sur https://github.com/ElouanMB/logiciel-psychonaut
2. Cliquer sur le bouton vert **"Code"**
3. Choisir **"Download ZIP"**
4. Extraire le ZIP dans un dossier de votre choix

### Étape 2 : Installer automatiquement

1. Double-cliquez sur **`auto-setup.bat`** à la racine du projet
2. Le script s'occupe de **TOUT** automatiquement :
3. C'est terminé ! 🎉

> 💡 **Aucun prérequis nécessaire !** `auto-setup.bat` gère tout, un raccourcie avec le logo de Psychonaut devrait être créé sur votre bureau

### Étape 3 : Lancer l'application

Double-cliquez sur le raccourci **"Psychonaut Analyzer"** créé sur votre bureau

---

## � Utilisation Quotidienne

### Démarrer l'application
- Double-cliquez sur le raccourci bureau **"Psychonaut Analyzer"**
- L'application s'ouvrira automatiquement dans votre navigateur

### Arrêter l'application
- Fermez la fenêtre du terminal (console noire)
- Ou appuyez sur `Ctrl + C` dans le terminal

### Mettre à jour l'application
- Cliquez sur le bouton **"Mettre à jour"** dans l'interface web (page d'accueil)
---

## 📂 Structure des Fichiers

```
logiciel-psychonaut/
├── auto-setup.bat           ← ⭐ INSTALLEUR PRINCIPAL (lance-moi !)
├── START_HERE.md            ← Point de départ pour les nouveaux utilisateurs
├── README.md                ← Documentation complète du projet
├── LICENSE                  ← Licence du logiciel
├── scripts/                 ← Scripts d'installation et lancement
│   ├── check-nodejs.bat     ← Vérifie/installe Node.js
│   ├── install.bat          ← Installation des dépendances
│   ├── start.bat            ← Lancer l'application
│   ├── create-shortcut.bat  ← Créer raccourci bureau
│   └── ...                  ← Autres scripts utilitaires
├── docs/                    ← Documentation
│   ├── INSTALLATION.md      ← Ce fichier
│   └── QUICK_START.md       ← Guide rapide
├── public/                  ← Interface web (HTML/CSS/JS)
├── src/                     ← Code source backend (Node.js)
├── ressources/              ← Images et icônes
├── config/                  ← Configuration (auto-créé)
├── data/                    ← Données de l'application (auto-créé)
└── server.js                ← Serveur principal
```

---

## 🔒 Sécurité

- Vos identifiants sont stockés localement dans `config/.env`
- Aucune donnée n'est envoyée à des serveurs tiers
- Quand vous installez le logiciel c'est votre version, rien n'est connecté, tout est en local donc vous faites ce que vous voulez

---
