# Origami Digital — spécification de conception

Date : 2026-09-25 · Statut : validée section par section, en relecture

## 1. Intention

Site vitrine de **Origami Digital**, agence web fictive, pour le cours WR505 (seule consigne : JAMstack Astro + Vue).

- **Critère de réussite** : un site qui **impressionne** : identité visuelle forte et mémorable, digne d'un portfolio. La technique sert le rendu.
- **Personnalité** : studio **expérimental**, audacieux et joueur ; interactions surprenantes, mouvement.
- **Concept** : le pli. La lumière néon se plie en facettes ; les pages se plient et se déplient.
- **Réalisation** : Enzo seul avec Claude. Contenu entièrement inventé par Claude (projets, services, équipe, textes), en français.
- **Approche technique retenue** : web natif (CSS 3D, SVG, API navigateur), **aucune bibliothèque d'animation ni WebGL**.

## 2. Pages

| Route | Contenu |
|---|---|
| `/` | Hero signature (feuille interactive) avec titre, manifeste court, 3 projets `featured`, aperçu Studio, appel à l'action vers Contact |
| `/projets` | Grille de tous les projets (visuels génératifs) + filtre par discipline |
| `/projets/[slug]` | Étude de cas : visuel génératif large, client, année, disciplines, contexte, enjeu, réponse, résultats, lien vers le projet suivant |
| `/studio` | Manifeste, services, méthode en étapes, équipe |
| `/contact` | Formulaire Netlify + coordonnées fictives |
| `/contact/merci` | Confirmation d'envoi (cible du formulaire sans JavaScript) |
| `404` | Page « feuille froissée » avec retour à l'accueil |

Navigation principale : Projets, Studio, Contact (logo → accueil).

## 3. Contenu

Collections déclarées dans `src/content.config.ts` (API Content Layer, schémas Zod), données dans `src/content/`.

**`projets`** (Markdown, 6 entrées) :
`title`, `client`, `year`, `disciplines` (liste parmi : `site`, `identité`, `interface`, `expérience`), `summary`, `seed` (entier), `palette` (3 couleurs hex de la famille néon), `featured` (booléen, 3 projets à `true`), `order` (entier) ; corps Markdown = étude de cas (sections Contexte, Enjeu, Réponse, Résultats).

**`services`** (4 entrées) : `title`, `description`, `deliverables` (liste), `order`.

**`equipe`** (4 entrées) : `name`, `role`, `bio` (2 phrases), `seed`, `order`.

Ton éditorial : direct, joueur, confiant ; phrases courtes ; vocabulaire du pli sans en abuser.

## 4. Architecture des composants

```
src/
  content.config.ts
  content/{projets,services,equipe}/
  layouts/BaseLayout.astro          head, SEO/OpenGraph, Header, Footer, ClientRouter (View Transitions)
  components/
    Header.astro, Footer.astro, SkipLink.astro
    generatif/Pli.astro             moteur génératif (voir §5.3)
    generatif/pli.ts                géométrie pure (PRNG, triangulation, plis), partagée avec FeuilleHero
    CarteProjet.astro, ListeServices.astro, Methode.astro, CarteMembre.astro, Appel.astro
    islands/FeuilleHero.vue         client:visible
    islands/FiltreProjets.vue       client:visible
    islands/MenuMobile.vue          client:idle
    islands/FormulaireContact.vue   client:visible
  pages/index.astro, projets/index.astro, projets/[slug].astro, studio.astro,
        contact/index.astro, contact/merci.astro, 404.astro
  styles/tokens.css, global.css
```

- **Flux de données** : collections → pages Astro (`getCollection` au build) → props → composants statiques ou îlots. Les îlots reçoivent des données déjà sérialisées ; **aucun appel réseau à l'exécution** (hors envoi du formulaire).
- `pli.ts` est du TypeScript pur sans dépendance au DOM : utilisé au build par `Pli.astro` et côté client par `FeuilleHero.vue`, pour que la géométrie soit la même des deux côtés.

## 5. Interactions signature

### 5.1 Feuille hero (`FeuilleHero.vue`)
- Feuille de 20 à 40 facettes triangulaires issues d'un motif de plis (`pli.ts`).
- **Pointeur** : les facettes proches se soulèvent et se plient vers lui (`rotate3d` par facette, éclairage selon l'angle). Tactile : réaction au toucher et au glissé.
- **Scroll** : la feuille se replie progressivement en une **grue origami** en facettes, puis dégage vers le manifeste.
- **Repli** : avant hydratation et sous `prefers-reduced-motion`, SVG statique identique rendu par `Pli.astro`.

### 5.2 Transitions de page (View Transitions d'Astro)
- Carte projet → étude de cas : le visuel génératif se transforme de la vignette vers le hero (`transition:name` par projet).
- Autres navigations : transition « pli » en CSS sur `::view-transition-*` (l'ancienne page se replie en diagonale, la nouvelle se déplie). Sous `reduced-motion` : fondu enchaîné simple.

### 5.3 Visuels génératifs (`Pli.astro`, au build)
- PRNG à graine : même `seed` = même visuel.
- Grille de points perturbée → triangulation → 1 à 3 plis (droites séparant le plan) → teinte de chaque facette selon la palette et son côté des plis.
- Formats : `vignette` (4:3), `hero` (large), `avatar` (carré, moins de facettes). Nombre de facettes plafonné par format.
- SVG inline, `aria-hidden="true"`, zéro JavaScript.

### 5.4 Micro-interactions (CSS seul)
- Carte projet au survol et au focus : un coin se replie et révèle la couleur suivante de la palette.
- Liens et boutons : léger effet de pli au survol et au focus.
- Apparitions au scroll via `animation-timeline: view()` ; contenu statique si non supporté.

**Hors périmètre** : curseur personnalisé, son, WebGL, préchargeur, bibliothèque de smooth scroll, thème clair.

## 6. Direction visuelle « Néon plié »

Tokens dans `src/styles/tokens.css` :

| Token | Valeur | Usage |
|---|---|---|
| `--color-bg` | `#0D0D12` | Fond de toutes les pages (site **sombre uniquement**) |
| `--color-surface` | `#16151F` | Cartes, champs |
| `--color-line` | `#2A2840` | Séparateurs, bordures |
| `--color-text` | `#F2F0FF` | Texte principal |
| `--color-text-muted` | `#A9A4C7` | Texte secondaire |
| `--color-violet` | `#7B5CFF` | Facettes, grandes formes, bordures (**pas de texte courant**) |
| `--color-link` | `#A08CFF` | Liens |
| `--color-pink` | `#FF5FA2` | Mots en exergue, états actifs |
| `--color-lime` | `#D4FF3A` | **Appel à l'action principal uniquement** (fond lime, texte `--color-bg`) ; contour de focus |

- **Texte toujours en couleur unie** (pas de dégradé sur du texte). Les dégradés restent dans les facettes.
- **Typographie** : titres **Unbounded 800**, très grands (`clamp()` ≈ 40 px mobile → ≈ 120 px hero), interlettrage serré ; texte **Inter 400/500**, 16–18 px, interligne 1,6. Polices auto-hébergées par l'API `fonts` intégrée d'Astro (aucune dépendance).
- **Palettes de projet** : chaque projet a son trio dans la famille néon (ex. violet/rose/cyan, lime/violet/marine).
- **Mise en page** : marges généreuses, grille asymétrique ; titres pleine largeur, texte en colonne étroite ; les facettes peuvent déborder du cadre. Mobile d'abord ; menu mobile en panneau plein écran.

## 7. Qualité

### Accessibilité
- `prefers-reduced-motion` respecté partout (§5).
- HTML sémantique, un seul `h1` par page, lien d'évitement, focus toujours visible (contour lime).
- Visuels génératifs et feuille hero décoratifs (`aria-hidden`) ; le sens est porté par le texte. Avatars : `alt` avec le nom.
- Filtre : boutons `aria-pressed`, nombre de résultats annoncé (`aria-live`).
- Menu mobile : piège de focus, fermeture par Échap, retour du focus au bouton.
- Contrastes AA minimum pour tout texte.

### Performance
- Objectif **Lighthouse ≥ 90** sur les 4 axes (mobile).
- HTML statique partout sauf les 4 îlots ; Vue n'est chargé que sur les pages qui en ont besoin.
- 2 familles de polices en `woff2` sous-ensemblées.

### Formulaire de contact (Netlify Forms)
- Formulaire HTML statique `data-netlify="true"` + champ piège (honeypot). Champs : nom, e-mail, type de projet, message.
- L'îlot Vue ajoute la validation côté client (requis, format e-mail, messages au plus près des champs) et les états envoi / succès / erreur sur place (envoi en `fetch` encodé `application/x-www-form-urlencoded`).
- **Sans JavaScript** : envoi classique → `/contact/merci`.
- Non fonctionnel en `npm run dev` : se teste sur un aperçu Netlify.

### SEO et partage
- Titre et description uniques par page, balises OpenGraph, `robots.txt`.
- `sitemap.xml` via `@astrojs/sitemap` : **seule nouvelle dépendance**, à consigner dans `docs/DECISIONS.md`. Nécessite `site` dans `astro.config.mjs` = URL de production Netlify du site.

## 8. Validation (sans tests automatisés, choix du projet)

Pour chaque tâche : `npm run build` passe ; vérification dans le navigateur sur mobile et desktop, avec et sans `reduced-motion` ; relecture croisée avant fusion (CLAUDE.md §6). En fin de projet : Lighthouse sur l'aperçu Netlify et test d'envoi du formulaire.

## 9. Décisions à consigner dans `docs/DECISIONS.md`

- Approche web native sans WebGL ni bibliothèque d'animation (alternatives : Three.js/OGL, moteur Canvas 2D).
- Direction « Néon plié », site sombre uniquement (alternatives : Papier & encre, Kami couleur).
- Visuels génératifs au build plutôt que photos ou maquettes d'écrans.
- Netlify Forms pour le contact.
- Ajout de `@astrojs/sitemap`.
