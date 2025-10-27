# 🧪 Psychonaut analyse manager



> Suite d'outils web pour faciliter la gestion des demandes d'analyse sur le forum Psychonaut.
> Connexion automatique avec identifiants et session persistée pour accéder aux pages privées visibles par votre compte.


## 🚀 Installation

Notes:



## 💻 Utilisation

### Interface Web


#### Pages disponibles :


```

## 🏗️ Structure du projet

```
logiciel-psychonaut/
├── scripts/                   ← Scripts d'installation et outils CLI
│   ├── install.bat            ← Installation des dépendances
│   ├── start.bat              ← Lancement de l'application
│   ├── setup.bat              ← Installation complète (un clic)
│   ├── create-shortcut.bat    ← Création du raccourci bureau
│   ├── create-shortcut.ps1    ← Script PowerShell pour raccourci
│   ├── xenforo-login-fetch.js ← Script de récupération XenForo
│   └── analyze-threads-online.js ← Script d'analyse en ligne
├── docs/                      ← Documentation
│   ├── INSTALLATION.md        ← Guide d'installation complet
│   └── QUICK_START.md         ← Guide de démarrage rapide
├── config/                    ← Configuration (non versionnée)
│   ├── .env                   ← Identifiants (à créer)
│   └── .xf-session.json       ← Session XenForo (auto-généré)
├── data/                      ← Données persistées
│   ├── recueil.json           ← Ressources documentaires
│   └── redaction.json         ← Documents de rédaction
├── public/                    ← Interface web (frontend)
│   ├── index.html             ← Page d'accueil
│   ├── analyze.html           ← Analyse des demandes
│   ├── recueil.html           ← Recueil de ressources
│   ├── redaction.html         ← Rédaction de comptes-rendus
│   └── *.css, *.js            ← Styles et scripts
├── src/                       ← Backend
│   ├── routes/                ← Routes Express
│   ├── services/              ← Logique métier
│   ├── middlewares/           ← Middlewares
│   └── config/                ← Configuration backend
├── ressources/                ← Assets statiques (logos, icônes)
├── results/                   ← Résultats d'analyse (auto-généré)
├── server.js                  ← Serveur Express principal
├── package.json               ← Configuration npm et dépendances
└── README.md                  ← Ce fichier
```

## 🔒 Sécurité

- ✅ Les identifiants sont stockés dans `config/.env` (non versionné)
- ✅ La session XenForo est persistée localement et renouvelée automatiquement
- ✅ Les données sensibles ne sont jamais exposées dans le code source
