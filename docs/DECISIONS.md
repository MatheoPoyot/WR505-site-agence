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

## 2026-09-25 — Direction « Néon plié » et approche web native

- **Décision** : identité sombre « Néon plié » (Unbounded + Inter, violet/rose/lime/cyan sur encre nuit). Effets en CSS 3D, SVG et API navigateur, sans WebGL ni bibliothèque d'animation.
- **Alternatives écartées** : directions « Papier & encre » et « Kami couleur » ; Three.js/OGL ; moteur Canvas 2D côté client.
- **Raison** : identité mémorable demandée ; poids minimal et approche cohérente avec la JAMstack. Voir `docs/superpowers/specs/2026-09-25-origami-digital-design.md`.

## 2026-09-25 — Polices auto-hébergées et sitemap

- **Décision** : polices via l'API `fonts` intégrée d'Astro (fournisseur Google, fichiers téléchargés au build et servis par le site) ; ajout de `@astrojs/sitemap` avec `site` = `https://origami-digital.netlify.app`.
- **Alternatives écartées** : lien direct vers Google Fonts (requête tierce, flash de police) ; paquets `@fontsource` (dépendances) ; sitemap écrit à la main.
- **Raison** : performance et vie privée sans dépendance pour les polices ; sitemap maintenu automatiquement pour une dépendance légère et officielle.
