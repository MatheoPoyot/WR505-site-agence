# CLAUDE.md — Site d'agence (WR505)

## 1. Contexte du projet

Site vitrine d'une **agence web fictive** qui conçoit des sites pour ses clients. Projet de cours WR505 ; seule consigne imposée : une **JAMstack avec Astro + Vue**.

- **Stack** : Astro 7 (rendu statique) + `@astrojs/vue` 7 / Vue 3.5 pour les îlots interactifs, TypeScript strict, npm, Node 22 (`.nvmrc`).
- **Hébergement** : Netlify. `netlify.toml` : build `npm run build`, publication de `dist/`. Node : `.nvmrc` (source unique).
- **Dépôt** : `origin` = `https://github.com/MatheoPoyot/WR505-site-agence` (propriétaire : MatheoPoyot ; collaborateurs : solene-andre, enzo-richand). Compte utilisé ici : `enzo-richand`.
- **Pas de tests ni de lint/format** : choix explicite pour ce projet. Ne pas en ajouter sans accord.
- **Docs** : `docs/DECISIONS.md` (décisions techniques). Pas encore de PRD.

Arborescence :

```
src/
  pages/        routes (fichiers .astro, kebab-case)
  layouts/      gabarits de page (.astro) — BaseLayout.astro : <head>, lang="fr", styles globaux
  components/   composants .astro (statiques) et .vue (interactifs)
  content/      données des collections (projets, services, équipe…), déclarées dans src/content.config.ts
  styles/       global.css (reset) ; tokens.css à venir avec la direction visuelle
public/         fichiers servis tels quels (favicon, images non traitées)
netlify.toml    configuration de déploiement
```

## 2. Commandes

| Action   | Commande           |
|----------|--------------------|
| Installer | `npm install`     |
| Lancer (dev, `localhost:4321`) | `npm run dev` |
| Builder  | `npm run build`    |
| Prévisualiser le build | `npm run preview` |
| Ajouter une intégration | `npx astro add <nom>` |

Aucune commande de test, lint ou format : ne pas en inventer.

## 3. Gitflow (obligatoire)

- `main` : production uniquement (déployée par Netlify). **Jamais de commit direct.**
- `develop` : intégration. **Jamais de commit direct** (exception : le commit initial de mise en place).
- `feature/<nom-court>` depuis `develop` → fusion vers `develop`.
- `release/<version>` depuis `develop` → fusion vers `main` **et** `develop`, avec un tag `v<version>`.
- `hotfix/<nom>` depuis `main` → fusion vers `main` **et** `develop`.
- Commits en **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `style:`), en français, petits et atomiques.
- **Interdit sans mon accord explicite** : `push --force`, rebase d'une branche partagée, fusion vers `main`, push vers `origin`.
- Le dépôt est partagé avec d'autres collaborateurs : toujours `git fetch` avant de créer une branche ou de fusionner, et signaler toute divergence avec `origin`.

## 4. Workflow dynamique

Avant chaque tâche, la classer et **annoncer la classe choisie** :

- **Triviale** (typo, renommage, ajustement local) : exécution directe. Pas de nouvelle branche si une feature est déjà en cours. Relecture rapide.
- **Standard** (fonctionnalité ou bug circonscrit) : branche `feature/` → plan court → implémentation → vérifications (§7) → relecture croisée (§6) → fusion vers `develop`.
- **Complexe** (plusieurs modules, architecture, refonte) : plan détaillé **soumis à ma validation avant de coder** → découpage en sous-tâches → agents en parallèle (§5) → relecture croisée → intégration → validation finale.

Si une tâche se révèle plus complexe que prévu : s'arrêter, la reclasser et me prévenir.

## 5. Agents en parallèle

- Découper les tâches complexes en sous-tâches **indépendantes**, avec des périmètres de fichiers qui ne se chevauchent pas.
- Chaque agent travaille dans **son propre git worktree** (`.claude/worktrees/`, ignoré par git) et sur **sa propre branche** `feature/`.
- Chaque sous-tâche est définie par : objectif, fichiers concernés, critères de réussite.
- Deux sous-tâches qui touchent les mêmes fichiers sont exécutées **séquentiellement**.
- Fichiers partagés à risque (`astro.config.mjs`, `package.json`, `src/styles/` globaux, layouts) : un seul agent à la fois, ou modifiés par l'orchestrateur.
- L'orchestrateur intègre les résultats et résout les conflits, jamais les sous-agents entre eux.

## 6. Relecture croisée (obligatoire)

- Tout code est relu par un agent qui **ne l'a pas écrit**, avec un contexte neuf : il reçoit le diff et l'objectif, pas le raisonnement de l'auteur.
- Checklist du relecteur :
  - correction fonctionnelle et cas limites (contenu vide, texte long, images manquantes) ;
  - gestion d'erreurs (formulaires, données absentes) ;
  - sécurité : secrets, validation des entrées, `set:html` / `v-html` sur du contenu non maîtrisé ;
  - accessibilité de base : sémantique HTML, `alt`, contrastes, navigation au clavier ;
  - rendu responsive (mobile, tablette, desktop) ;
  - bon usage des îlots : Vue uniquement si c'est interactif, directive `client:*` la plus légère possible ;
  - lisibilité et respect des conventions (§8).
- Retours classés en **bloquant** / **à améliorer** / **suggestion**.
- Aucune fusion tant qu'un point bloquant reste ouvert. Les corrections sont relues à nouveau.

## 7. Portes de validation

Une tâche n'est terminée que si :

1. `npm run build` passe sans erreur ni avertissement nouveau ;
2. le rendu a été vérifié dans le navigateur (`npm run dev` ou `npm run preview`) sur les pages touchées ;
3. la relecture croisée est validée ;
4. la documentation concernée est à jour.

Ne jamais déclarer une tâche terminée sans avoir exécuté ces vérifications. Ne jamais contourner une erreur de build (désactiver une vérification, `// @ts-ignore`, etc.) pour la faire passer.

## 8. Conventions de code

- **Astro par défaut** : toute page ou section statique est un composant `.astro`. **Vue seulement pour l'interactivité** (menu mobile, filtres, formulaire, carrousel), hydraté avec la directive la plus légère possible (`client:visible` ou `client:idle` avant `client:load`).
- **Nommage** : composants en `PascalCase` (`ProjectCard.astro`, `ContactForm.vue`), pages et dossiers de routes en `kebab-case`, variables et fonctions en `camelCase`, constantes globales en `UPPER_SNAKE_CASE`.
- **Vue** : `<script setup lang="ts">`, Composition API, props typées avec `defineProps<…>()`.
- **TypeScript** : config `strict` d'Astro, pas de `any` sans justification.
- **Contenu** : les données (projets, services, équipe, témoignages) vivent dans des collections typées (schémas dans `src/content.config.ts`, données dans `src/content/`), pas en dur dans les composants.
- **Styles** : `<style>` scopé par composant ; tokens (couleurs, typo, espacements) en variables CSS dans `src/styles/tokens.css`. Pas de valeurs magiques répétées.
- **Images** : via `astro:assets` (`<Image />`), toujours avec un `alt` pertinent.
- **Langue** : contenu du site et commentaires en français ; identifiants de code en anglais.
- **Erreurs** : les formulaires valident côté client et affichent des messages clairs ; aucune erreur silencieuse.

## 9. Documentation et décisions

- Tenir `docs/DECISIONS.md` : chaque choix technique important (date, décision, alternatives écartées, raison).
- Mettre à jour `README.md` et `CHANGELOG.md` lors de chaque release.
- Mettre à jour ce `CLAUDE.md` quand une règle ou une commande change, et **me signaler la modification**.

## 10. Sécurité et interdits

- Jamais de secrets en dur : `.env` (ignoré) et `.env.example` (versionné). Côté Astro, seules les variables `PUBLIC_*` sont exposées au client : n'y mettre rien de sensible.
- Pas de nouvelle dépendance sans justification (besoin, alternatives, poids). Préférer les fonctionnalités natives d'Astro et du navigateur.
- Pas de suppression de fichiers ou de données sans confirmation.
- En cas de doute sur une intention, demander plutôt que supposer.

## 11. Communication

- Réponses en français.
- En fin de tâche, résumé court : ce qui a été fait, fichiers modifiés, résultat des vérifications (§7), points ouverts.
