# Décisions techniques

Format : date, décision, alternatives écartées, raison.

## 2026-09-25 — Astro + Vue

- **Décision** : Astro 7 (rendu statique) avec l'intégration `@astrojs/vue` pour les îlots interactifs, TypeScript strict, npm.
- **Alternatives écartées** : Nuxt (le template Netlify présent auparavant sur le dépôt), Astro seul.
- **Raison** : consigne du cours WR505 (JAMstack Astro + Vue). Astro livre du HTML statique par défaut ; Vue n'est chargé que là où il y a de l'interactivité.

## 2026-09-25 — Hébergement Netlify

- **Décision** : déploiement sur Netlify. `netlify.toml` définit le build (`npm run build`, publication de `dist/`) ; `.nvmrc` est la source unique de la version de Node (22), lue en local et par Netlify.
- **Alternatives écartées** : Vercel, GitHub Pages.
- **Raison** : choix de l'équipe ; déploiement continu depuis GitHub et aperçus des pull requests par défaut (aperçus de branches activables dans l'interface Netlify).

## 2026-09-25 — Pas de tests ni de lint/format

- **Décision** : aucun outil de test, de lint ni de formatage.
- **Alternatives écartées** : Vitest, Playwright, ESLint, Prettier.
- **Raison** : choix explicite pour ce projet. La validation repose sur le build, la vérification visuelle dans le navigateur et la relecture croisée.

## 2026-09-25 — Fins de ligne LF

- **Décision** : `.gitattributes` impose LF dans le dépôt.
- **Alternatives écartées** : laisser `core.autocrlf` propre à chaque poste.
- **Raison** : dépôt partagé entre plusieurs collaborateurs et OS ; évite les diffs parasites.

## 2026-09-25 — Champ `allowScripts` dans package.json

- **Décision** : conserver `"allowScripts": { "esbuild": true }`, hérité du template officiel `create-astro`.
- **Alternatives écartées** : le retirer.
- **Raison** : rester aligné sur le template Astro. Le champ est sans effet avec npm 11.6.2 (non reconnu) ; il ne change rien à l'installation.
