# Site d'agence — WR505

Site vitrine d'une agence web fictive, réalisé en JAMstack avec **Astro** et **Vue**, déployé sur **Netlify**.

## Prérequis

Node.js 22 (version fixée dans `.nvmrc`, lue aussi par Netlify). Avec nvm : `nvm use`.

## Commandes

| Commande          | Action                                         |
|-------------------|------------------------------------------------|
| `npm install`     | Installe les dépendances                       |
| `npm run dev`     | Lance le serveur de dev sur `localhost:4321`   |
| `npm run build`   | Génère le site statique dans `dist/`           |
| `npm run preview` | Sert le build localement                       |

## Structure

```
src/
  pages/        routes
  layouts/      gabarits de page
  components/   composants .astro et îlots .vue
  content/      collections de contenu
  styles/       styles globaux
public/         fichiers statiques
docs/           décisions techniques
```

## Déploiement

Netlify : build et dossier publié dans `netlify.toml`, version de Node dans `.nvmrc`. La branche de production (`main`) et les aperçus de branches se règlent dans l'interface Netlify ; les pull requests ont un aperçu par défaut.

## Workflow

Gitflow (`main`, `develop`, `feature/*`, `release/*`, `hotfix/*`) et Conventional Commits. Voir `CLAUDE.md` et `docs/DECISIONS.md`.
