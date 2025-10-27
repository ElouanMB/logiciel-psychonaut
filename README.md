# 🧪 Psychonaut analyse manager



> Suite d'outils web pour faciliter la gestion des demandes d'analyse sur le forum Psychonaut.
> Connexion automatique avec identifiants et session persistée pour accéder aux pages privées visibles par votre compte.


## 🚀 Installation en 2 Étapes !

### Étape 1 : Télécharger le projet

**Option A - Avec Git (nécessite d'avoir git installé)**
```bash
git clone https://github.com/ElouanMB/logiciel-psychonaut.git
```

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

## ⚙️ Utilisation

### Démarrer l'application
- Double-cliquez sur le raccourci bureau **"Psychonaut Analyzer"**
- L'application s'ouvrira automatiquement dans votre navigateur

### Arrêter l'application
- Fermez la fenêtre du terminal (console noire)
- Ou appuyez sur `Ctrl + C` dans le terminal

### Mettre à jour l'application
- Cliquez sur le bouton **"Mettre à jour"** dans l'interface web (page d'accueil)

---

## 💻 Interface Web

### Accueil 
- L'accueil permet de se connecter a son compte Psychonaut et mettre à jour le logiciel si nécessaire.
- Il y a trois outils accessible depuis l'accueil.

### Analyse des demandes
- Cette page permet de lire les demandes d'analyse sur psychonaut, le logiciel a accès à ses informations via Xenforo uniquement si on est connecté à son compte psychonaut et si on a les autorisations pour voir les demandes sur le forum.
- On peut choisir le nombre de page à lire ainsi que le nom du document que ça vas créer
- Une fois le document créé on voit le nombre de demande et le type dans l'onglet Fichiers générés, on peut cliquer sur la loupe afin d'afficher les précisions.
- Les détails vont contenir trois colonnes : Ouverts avec résultats, Ouverts sans résultats et Fermés.
Le code vérifie si le résultat d'analyse est disponible sur Psychoactif ou Druglab, si c'est le cas il sera dans Ouverts avec résultats.
- Si on appuie sur le bouton Rédiger ça vas ouvrir la page Redaction afin d'écrire le rendu.

### Recueil de Ressources
- Cette page permet de renseigner les notes et liens pour un produit ou une notion comme "Envoi SINTES". Cette liste est personnel mais on peut télécharger tout le recueil ou bien un élèment précisemment sous format pdf afin de completer le template disponible à tous les collecteurs (on peux y accéder depuis les liens en haut à gauche du site)
- Ce qui est renseigné dans le Recueil sera disponible après par la suite dans la page Rédaction de comptes-rendus.

### Rédaction de comptes-rendus 
- Cette page permet la rédaction des rendus de résultat.
- Quand on rédige un nouveau document il y a un template avec du bbcode (le format de text) par défaut qui est modifiable à votre guise avec le bouton paramètre dans la partie "Documents sauvegardés".
- Le bouton insérer une ressource permet de choisir quelque chose dans le Recueil pour l'inclure dans le rendu.
- Le bouton Aperçu permet de voir à quoi ça ressemblera sur le site avec toute la mise en forme/
- Le bouton Aller au rendu, permet d'ouvrir un thread de rendu d'analyse, de mettre le label et le titre automatiquement mais pas le textte ! Quand vous cliquez sur le bouton normalement votre texte est automatiquement copier dans votre presse papier donc vous aurez juste à le coller, relire et poster le résultat.
- Il est possible de sauvegarder chaque rendu écrit afin de finir de les écrires plus tard ou en garder une trace pour faciliter la rédaction des prochaines.

---

## 🏗️ Structure du projet

```
logiciel-psychonaut/
├── scripts/                   ← Scripts d'installation et outils CLI
│   ├── install.bat            ← Installation des dépendances
│   ├── start.bat              ← Lancement de l'application
│   ├── setup.bat              ← Installation complète
│   ├── create-shortcut.bat    ← Création du raccourci bureau
│   ├── create-shortcut.ps1    ← Script PowerShell pour raccourci
│   ├── xenforo-login-fetch.js ← Script de récupération XenForo
│   └── analyze-threads-online.js ← Script d'analyse en ligne
├── config/                    ← Configuration (non versionnée)
│   ├── .env                   ← Identifiants (auto-généré) 
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

---

## 🔒 Sécurité

- Vos identifiants sont stockés localement dans `config/.env`
- Aucune donnée n'est envoyée à des serveurs tiers
- Quand vous installez le logiciel c'est votre version, rien n'est connecté, tout est en local donc vous faites ce que vous voulez
