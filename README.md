# 🧪 Psychonaut Analyzer# Récupérer le HTML d’une page Psychonaut (XenForo)



> Suite d'outils web pour faciliter l'analyse de substances et la gestion des demandes d'analyse sur les forums Psychonaut et Psychoactif.Connexion automatique avec identifiants (XenForo) et session persistée pour accéder aux pages privées visibles par votre compte.



[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](./LICENSE)## Utilisation: login automatisé XenForo (session persistée)

[![Node.js](https://img.shields.io/badge/Node.js-18+-success.svg)](https://nodejs.org/)Cette méthode récupère `_xfToken`, poste le formulaire de login et réutilise automatiquement la session. La session est enregistrée localement pour éviter de vous reconnecter à chaque exécution.



## 📋 Table des matièresPré‑requis (une fois):

```powershell

- [Fonctionnalités](#-fonctionnalités)npm install

- [Installation](#-installation)```

- [Configuration](#-configuration)

- [Utilisation](#-utilisation)Créez un fichier `config/.env` (non versionné) avec vos identifiants:

- [Interface Web](#-interface-web)```

- [Scripts CLI](#-scripts-cli)XF_BASE=https://www.psychonaut.fr

- [Structure du projet](#-structure-du-projet)XF_USER=votre_identifiant

- [Sécurité](#-sécurité)XF_PASS=votre_mot_de_passe

- [Contribution](#-contribution)```

- [Licence](#-licence)

Utilisation (la session sera mémorisée dans `config/.xf-session.json`):

## ✨ Fonctionnalités```powershell

node .\xenforo-login-fetch.js --target "/forums/demandes.160" > .\mes-demandes.html

### Interface Web Complète```



- **🔐 Authentification** : Connexion sécurisée au forum Psychonaut (XenForo)Ou via script npm:

- **📊 Analyse des demandes** : Visualisation et analyse des threads du forum "Demandes"```powershell

  - Catégorisation automatique (ouverts/fermés, avec/sans résultats)npm run fetch:xenforo -- --target "/forums/demandes.160"

  - Détection des identifiants DrugLab et Psychoactif# Raccourci direct pour la page "demandes"

  - Vérification automatique des résultats sur Psychoactifnpm run fetch:demande

  - Bouton "Rédiger" pour pré-remplir automatiquement les comptes-rendus```

- **📚 Recueil de ressources** : Gestion centralisée des documents de référence

  - Support multilingue (FR, EN, ES)### Analyse en ligne (toutes les pages ou limité)

  - Organisation par catégories- Toutes les pages:

  - Export/Import JSON```powershell

- **📝 Rédaction de comptes-rendus** : Éditeur BBCode avancénpm run analyze:online

  - Pré-remplissage automatique depuis les résultats Psychoactif```

  - Template personnalisable

  - Insertion de ressources depuis le recueil- Limiter le nombre de pages (ex: 1ère page uniquement):

  - Aperçu BBCode en temps réel```powershell

  - Publication directe sur le forum avec titre et label pré-remplisnpm run analyze:online:first

# ou avec un nombre personnalisé

### Scripts CLInode .\analyze-threads-online.js --pages 2 --out .\results\demande-report.json

```

- Récupération automatique de pages XenForo avec authentification

- Analyse de threads en ligne ou hors ligneSortie:

- Export des résultats en JSON- Par défaut, les scripts npm écrivent dans `./results/demande-report.json`.

- Session persistée pour éviter les reconnexions- Si `--out` n’est pas fourni, le script génère `./results/demande-report-YYYYMMDD-HHMMSS.json`.

- Le rapport inclut désormais: threads ouverts et fermés, tous les identifiants trouvés (DrugLab ou Autre), et pour chaque identifiant Autre un check Psychoactif avec l’URL de recherche.

## 🚀 Installation

Notes:

### Prérequis- 2FA/CAPTCHA ne sont pas gérés dans ce script. En cas de 2FA, utiliser Playwright (navigateur automatisé).

- Si la structure du site change, adaptez le sélecteur du token `_xfToken` si besoin.

- [Node.js](https://nodejs.org/) 18+ et npm - La session est persistée dans `config/.xf-session.json` et réutilisée. Si elle expire, le script relancera automatiquement un login en lisant `config/.env`.

- Compte sur le forum Psychonaut (pour l'authentification)

## Dépannage

### Installation- Redirection vers login / 403: identifiants incorrects, session expirée côté serveur, ou protection anti‑bot. Le script tente automatiquement un nouveau login si `config/.env` est présent.

- Vérifiez `XF_BASE` (doit pointer vers le domaine exact, ex: `https://www.psychonaut.fr`).

```bash- Erreurs anti‑bot (Cloudflare, etc.): envisager Playwright.

# Cloner le repository

git clone https://github.com/ElouanMB/logiciel-psychonaut.git## Sécurité

cd logiciel-psychonaut- Ne commitez pas `config/.env` ni `config/.xf-session.json` (déjà ignorés par `.gitignore`).

- Les sessions expirent: le script renouvellera automatiquement si `config/.env` est présent.

# Installer les dépendances- Respectez les CGU du site; limitez la fréquence des requêtes.

npm install
```

## ⚙️ Configuration

Créez un fichier `config/.env` avec vos identifiants Psychonaut :

```env
XF_BASE=https://www.psychonaut.fr
XF_USER=votre_identifiant
XF_PASS=votre_mot_de_passe
```

> ⚠️ **Important** : Le fichier `config/.env` est ignoré par Git. Ne partagez jamais vos identifiants !

## 💻 Utilisation

### Interface Web

Démarrez le serveur web :

```bash
npm run start:ui
```

Puis ouvrez votre navigateur à l'adresse : **http://localhost:3000**

#### Pages disponibles :

- **/** : Page d'accueil et configuration
- **/analyze.html** : Analyse des demandes du forum
- **/recueil.html** : Gestion du recueil de ressources
- **/redaction.html** : Rédaction de comptes-rendus

### Scripts CLI

#### Récupération de pages

```bash
# Page "Demandes" complète
npm run fetch:demande

# Page personnalisée
npm run fetch:xenforo -- --target "/forums/votre-page.123"
```

#### Analyse de threads

```bash
# Analyse complète (toutes les pages)
npm run analyze:online

# Analyse limitée (première page uniquement)
npm run analyze:online:first

# Analyse personnalisée (2 pages)
node analyze-threads-online.js --pages 2 --out ./results/rapport.json
```

## 🏗️ Structure du projet

```
logiciel-psychonaut/
├── config/                    # Configuration (non versionnée)
│   ├── .env                   # Identifiants (à créer)
│   └── .xf-session.json       # Session XenForo (auto-généré)
├── data/                      # Données persistées
│   ├── recueil.json           # Ressources documentaires
│   └── redaction.json         # Documents de rédaction
├── public/                    # Interface web (frontend)
│   ├── index.html             # Page d'accueil
│   ├── analyze.html           # Analyse des demandes
│   ├── recueil.html           # Recueil de ressources
│   ├── redaction.html         # Rédaction de comptes-rendus
│   └── *.css, *.js            # Styles et scripts
├── src/                       # Backend
│   ├── routes/                # Routes Express
│   ├── services/              # Logique métier
│   ├── middlewares/           # Middlewares
│   └── config/                # Configuration backend
├── ressources/                # Assets statiques
├── results/                   # Résultats d'analyse (auto-généré)
├── server.js                  # Serveur Express
├── xenforo-login-fetch.js     # Script de récupération XenForo
├── analyze-threads-online.js  # Script d'analyse en ligne
└── package.json
```

## 🔒 Sécurité

- ✅ Les identifiants sont stockés dans `config/.env` (non versionné)
- ✅ La session XenForo est persistée localement et renouvelée automatiquement
- ✅ Les données sensibles ne sont jamais exposées dans le code source
