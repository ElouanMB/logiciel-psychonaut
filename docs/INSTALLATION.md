# 📦 Guide d'Installation - Psychonaut Analyzer

## 🎯 Pour les Utilisateurs

### Prérequis
- **Windows 10/11** (64-bit recommandé)
- **Node.js 18+** : [Télécharger ici](https://nodejs.org/) (version LTS recommandée)
- **Connexion Internet** (pour l'installation initiale)

---

## 🚀 Installation Rapide

### ⭐ Méthode Automatique (Recommandée)

**Pour les utilisateurs sans Node.js ou qui veulent tout automatiser :**

1. Double-cliquez sur **`auto-setup.bat`** à la racine du projet
2. Le script va :
   - Détecter si Node.js est installé
   - Le télécharger et l'installer automatiquement si nécessaire
   - Installer toutes les dépendances npm
   - Créer un raccourci sur votre bureau
3. C'est terminé ! 🎉

### 📦 Méthode Manuelle (Si Node.js déjà installé)

### 📦 Méthode Manuelle (Si Node.js déjà installé)

### Étape 1 : Télécharger le projet

**Option A - Avec Git (recommandé)**
```bash
git clone https://github.com/ElouanMB/logiciel-psychonaut.git
cd logiciel-psychonaut
```

**Option B - Sans Git**
1. Aller sur https://github.com/ElouanMB/logiciel-psychonaut
2. Cliquer sur le bouton vert **"Code"**
3. Choisir **"Download ZIP"**
4. Extraire le ZIP dans un dossier de votre choix

### Étape 2 : Installer les dépendances

1. Double-cliquez sur **`scripts\install.bat`**
2. Attendez la fin de l'installation (quelques minutes)
3. Appuyez sur une touche quand demandé

> ⚠️ **Si Node.js n'est pas installé** : Le script ouvrira automatiquement la page de téléchargement. Installez Node.js puis relancez `scripts\install.bat`.

### Étape 3 : Créer le raccourci (optionnel)

1. Double-cliquez sur **`scripts\create-shortcut.bat`**
2. Un raccourci sera créé sur votre bureau

### Étape 4 : Lancer l'application

**Option A - Avec le raccourci**
- Double-cliquez sur **"Psychonaut Analyzer"** sur votre bureau

**Option B - Avec le fichier bat**
- Double-cliquez sur **`scripts\start.bat`** dans le dossier du projet

---

## 🔧 Premier Lancement

1. L'application va démarrer le serveur
2. Votre navigateur s'ouvrira automatiquement sur http://localhost:3000
3. Configurez vos identifiants Psychonaut dans la page d'accueil
4. C'est prêt ! 🎉

---

## 📱 Utilisation

### Démarrer l'application
- Double-cliquez sur le raccourci bureau **"Psychonaut Analyzer"**
- Ou lancez **`scripts\start.bat`**

### Arrêter l'application
- Fermez la fenêtre du terminal (console noire)
- Ou appuyez sur `Ctrl + C` dans le terminal

### Mettre à jour l'application
- Cliquez sur le bouton **"Mettre à jour"** dans l'interface web (page d'accueil)
- Ou exécutez : `git pull` dans le dossier du projet

---

## 🛠️ Dépannage

### "Node.js n'est pas installé"
➡️ Installez Node.js depuis https://nodejs.org/ (version LTS)

### "Le port 3000 est déjà utilisé"
➡️ Une instance est déjà en cours. Fermez l'autre fenêtre ou redémarrez votre PC.

### "Les dépendances ne sont pas installées"
➡️ Exécutez `scripts\install.bat` avant de lancer l'application.

### "La page ne s'ouvre pas"
➡️ Ouvrez manuellement : http://localhost:3000 dans votre navigateur

### Erreur lors de la mise à jour
➡️ Vérifiez votre connexion Internet et que Git est installé

---

## 📂 Structure des Fichiers

```
logiciel-psychonaut/
├── scripts/                 ← Scripts d'installation et lancement
│   ├── install.bat          ← Installation des dépendances
│   ├── start.bat            ← Lancer l'application
│   ├── setup.bat            ← Installation complète
│   ├── create-shortcut.bat  ← Créer raccourci bureau
│   ├── create-shortcut.ps1  ← Script PowerShell pour raccourci
│   ├── xenforo-login-fetch.js ← Script de récupération XenForo
│   └── analyze-threads-online.js ← Script d'analyse en ligne
├── docs/                    ← Documentation
│   ├── INSTALLATION.md      ← Ce fichier
│   └── QUICK_START.md       ← Guide rapide
├── public/                  ← Interface web
├── src/                     ← Code source backend
├── ressources/              ← Images et icônes
├── config/                  ← Configuration (à créer)
├── data/                    ← Données (auto-généré)
├── server.js                ← Serveur principal
├── package.json             ← Dépendances
└── README.md                ← Documentation principale
```

---

## 🔒 Sécurité

- Vos identifiants sont stockés localement dans `config/.env`
- Aucune donnée n'est envoyée à des serveurs tiers
- Le projet est open-source (consultable sur GitHub)

---

## 📄 Licence

Ce logiciel est sous licence propriétaire restrictive.
Utilisation autorisée uniquement avec permission écrite.
Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

---

## 🆘 Support

Pour toute question ou problème :
- Consultez la [documentation complète](../README.md)
- Ouvrez une issue sur GitHub
- Contactez : @ElouanMB

---

**Bon usage ! 🚀**
