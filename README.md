# Récupérer le HTML d’une page Psychonaut (XenForo)

Connexion automatique avec identifiants (XenForo) et session persistée pour accéder aux pages privées visibles par votre compte.

## Utilisation: login automatisé XenForo (session persistée)
Cette méthode récupère `_xfToken`, poste le formulaire de login et réutilise automatiquement la session. La session est enregistrée localement pour éviter de vous reconnecter à chaque exécution.

Pré‑requis (une fois):
```powershell
npm install
```

Créez un fichier `config/.env` (non versionné) avec vos identifiants:
```
XF_BASE=https://www.psychonaut.fr
XF_USER=votre_identifiant
XF_PASS=votre_mot_de_passe
```

Utilisation (la session sera mémorisée dans `config/.xf-session.json`):
```powershell
node .\xenforo-login-fetch.js --target "/forums/demandes.160" > .\mes-demandes.html
```

Ou via script npm:
```powershell
npm run fetch:xenforo -- --target "/forums/demandes.160"
# Raccourci direct pour la page "demandes"
npm run fetch:demande
```

### Analyse en ligne (toutes les pages ou limité)
- Toutes les pages:
```powershell
npm run analyze:online
```

- Limiter le nombre de pages (ex: 1ère page uniquement):
```powershell
npm run analyze:online:first
# ou avec un nombre personnalisé
node .\analyze-threads-online.js --pages 2 --out .\results\demande-report.json
```

Sortie:
- Par défaut, les scripts npm écrivent dans `./results/demande-report.json`.
- Si `--out` n’est pas fourni, le script génère `./results/demande-report-YYYYMMDD-HHMMSS.json`.
- Le rapport inclut désormais: threads ouverts et fermés, tous les identifiants trouvés (DrugLab ou Autre), et pour chaque identifiant Autre un check Psychoactif avec l’URL de recherche.

Notes:
- 2FA/CAPTCHA ne sont pas gérés dans ce script. En cas de 2FA, utiliser Playwright (navigateur automatisé).
- Si la structure du site change, adaptez le sélecteur du token `_xfToken` si besoin.
 - La session est persistée dans `config/.xf-session.json` et réutilisée. Si elle expire, le script relancera automatiquement un login en lisant `config/.env`.

## Dépannage
- Redirection vers login / 403: identifiants incorrects, session expirée côté serveur, ou protection anti‑bot. Le script tente automatiquement un nouveau login si `config/.env` est présent.
- Vérifiez `XF_BASE` (doit pointer vers le domaine exact, ex: `https://www.psychonaut.fr`).
- Erreurs anti‑bot (Cloudflare, etc.): envisager Playwright.

## Sécurité
- Ne commitez pas `config/.env` ni `config/.xf-session.json` (déjà ignorés par `.gitignore`).
- Les sessions expirent: le script renouvellera automatiquement si `config/.env` est présent.
- Respectez les CGU du site; limitez la fréquence des requêtes.
