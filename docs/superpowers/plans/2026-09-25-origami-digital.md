# Origami Digital — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** construire le site vitrine d'Origami Digital (5 gabarits de pages + merci + 404) en Astro + Vue, direction « Néon plié », avec visuels génératifs au build, feuille hero interactive et transitions de page « pli ».

**Architecture :** tout est HTML statique généré par Astro à partir de collections de contenu typées. Un module de géométrie pur (`pli.ts`) alimente à la fois les SVG génératifs rendus au build (`Pli.astro`) et l'îlot `FeuilleHero.vue`. Quatre îlots Vue seulement (hero, filtre, menu mobile, formulaire) ; les transitions passent par le `ClientRouter` d'Astro.

**Tech Stack :** Astro 7.3, @astrojs/vue 7 / Vue 3.5, TypeScript strict, API `fonts` intégrée d'Astro (Google : Unbounded, Inter), @astrojs/sitemap, Netlify (+ Netlify Forms). Node 22 (`.nvmrc`).

**Spec :** `docs/superpowers/specs/2026-09-25-origami-digital-design.md`

## Global Constraints

- Aucun outil de test, lint ou format (décision projet). La vérification = `npm run build` + contrôles `grep`/`node` indiqués dans chaque tâche + contrôle navigateur en Tâche 11.
- **Seule nouvelle dépendance autorisée : `@astrojs/sitemap`.** Aucune bibliothèque d'animation, aucun WebGL.
- `site` = `https://origami-digital.netlify.app`.
- Tokens exacts : `--color-bg #0D0D12`, `--color-surface #16151F`, `--color-line #2A2840`, `--color-text #F2F0FF`, `--color-text-muted #A9A4C7`, `--color-violet #7B5CFF` (jamais pour du texte courant), `--color-link #A08CFF`, `--color-pink #FF5FA2`, `--color-lime #D4FF3A` (CTA principal et focus uniquement), `--color-cyan #35E0FF` (palettes génératives).
- Texte toujours en couleur unie : **aucun dégradé sur du texte**.
- Titres Unbounded 800, texte Inter 400/500 ; site **sombre uniquement**.
- Contenu du site en français ; identifiants de code en français ou anglais cohérents avec le fichier ; commentaires en français.
- Liens internes **avec barre finale** (`/projets/`, `/studio/`, `/contact/`, `/projets/<id>/`).
- Tout mouvement respecte `prefers-reduced-motion: reduce` (aucune animation de transformation).
- Commits Conventional Commits en français ; une branche `feature/<nom>` par tâche depuis `develop`, fusion `--no-ff` vers `develop` après relecture croisée (CLAUDE.md §3, §6). **Pas de push sans accord de l'utilisateur.**
- Chaque nouvelle décision technique est ajoutée à `docs/DECISIONS.md` dans la tâche qui la prend.

## Review Focus

1. **Navigation par View Transitions** : après une navigation côté client, les îlots de la nouvelle page (menu, filtre, hero, formulaire) fonctionnent et le défilement n'est jamais bloqué par un menu resté « ouvert ». → Tâche 3 (nettoyage `onBeforeUnmount`) et contrôle en Tâche 11.
2. **JavaScript désactivé** : tout le contenu reste visible (les apparitions au scroll sont en CSS pur, le filtre n'apparaît pas, le formulaire poste vers `/contact/merci/`). → Tâches 1, 6, 8, contrôle en Tâche 11.
3. **`prefers-reduced-motion`** : ni feuille animée, ni transition pli, ni apparition. → Tâches 1, 3, 9, contrôle en Tâche 11.
4. **Clavier seul** : lien d'évitement, menu (piège de focus, Échap, retour du focus), filtre (`aria-pressed`), formulaire (focus sur le premier champ en erreur). → Tâches 3, 6, 8, contrôle en Tâche 11.
5. **Écran de 320 px** : les très grands titres Unbounded ne provoquent aucun défilement horizontal. → Tâche 1 (`--fs-hero` plancher 2.25rem, césure), contrôle en Tâche 11.

## Parallélisation

Tâches 1 → 2 → 3 → 4 séquentielles (socle partagé). Puis **6, 7, 8 en parallèle** (fichiers disjoints). Puis **9 et 10 en parallèle** (9 dépend de `CarteProjet` (6) et `Appel` (7)). Tâche 11 par l'orchestrateur avec l'utilisateur. Chaque agent parallèle travaille dans son propre worktree (`.claude/worktrees/`).

## Carte des fichiers

```
astro.config.mjs                         T1  site, fonts, sitemap
public/robots.txt                        T1
src/styles/tokens.css                    T1  tokens
src/styles/global.css                    T1  base, utilitaires, apparitions ; T3 keyframes de transition
src/components/generatif/pli.ts          T2  géométrie pure (PRNG, facettes, plis, formats)
src/components/generatif/Pli.astro       T2  SVG génératif au build
src/components/generatif/grue.ts         T9  triangles cibles de la grue
src/transitions/pli.ts                   T3  animation de transition « pli »
src/layouts/BaseLayout.astro             T3  head, SEO, polices, ClientRouter, header/footer
src/components/SkipLink.astro            T3
src/components/Header.astro              T3
src/components/Footer.astro              T3
src/components/islands/MenuMobile.vue    T3
src/content.config.ts                    T4  schémas des collections
src/content/projets/*.md                 T4  6 projets
src/content/services/*.md                T4  4 services
src/content/equipe/*.md                  T4  4 membres
src/lib/contenu.ts                       T4  tri, projet suivant, libellés
src/components/CarteProjet.astro         T6
src/components/islands/FiltreProjets.vue T6
src/pages/projets/index.astro            T6
src/pages/projets/[slug].astro           T6
src/components/ListeServices.astro       T7
src/components/Methode.astro             T7
src/components/CarteMembre.astro         T7
src/components/Appel.astro               T7
src/pages/studio.astro                   T7
src/components/islands/FormulaireContact.vue T8
src/pages/contact/index.astro            T8
src/pages/contact/merci.astro            T8
src/components/islands/FeuilleHero.vue   T9
src/pages/index.astro                    T3 (provisoire) ; T9 (définitive)
src/pages/404.astro                      T10
```

---

### Task 1 : Fondations (tokens, polices, sitemap)

Branche : `feature/fondations`

**Files :**
- Modify : `astro.config.mjs`, `package.json`, `package-lock.json` (via npm)
- Create : `src/styles/tokens.css`, `public/robots.txt`
- Modify : `src/styles/global.css` (remplacement complet), `docs/DECISIONS.md`

**Interfaces :**
- Produces : variables CSS (`--color-*`, `--fs-*`, `--space-*`, `--gutter`, `--max-width`, `--measure`, `--radius`, `--ease-pli`, `--duree`, `--font-display`, `--font-body`) ; classes globales `.conteneur`, `.visually-hidden`, `.exergue`, `.bouton`, `.chapo`, `.revele`, `.prose`.

- [ ] **Step 1 : Créer la branche et installer le sitemap**

```bash
git switch develop && git switch -c feature/fondations
npx astro add sitemap --yes
```
Attendu : `@astrojs/sitemap` dans `dependencies`.

- [ ] **Step 2 : Remplacer `astro.config.mjs`**

```js
// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://origami-digital.netlify.app',
  integrations: [
    vue(),
    // La page de confirmation du formulaire n'a pas à être indexée
    sitemap({ filter: (page) => !page.includes('/contact/merci') }),
  ],
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Unbounded',
      cssVariable: '--font-display',
      weights: [800],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-body',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
});
```

- [ ] **Step 3 : Créer `src/styles/tokens.css`**

```css
/* Tokens de la direction « Néon plié ». Site sombre uniquement. */
:root {
  --color-bg: #0D0D12;
  --color-surface: #16151F;
  --color-line: #2A2840;
  --color-text: #F2F0FF;
  --color-text-muted: #A9A4C7;
  --color-violet: #7B5CFF; /* facettes et grandes formes, jamais du texte courant */
  --color-link: #A08CFF;
  --color-pink: #FF5FA2;
  --color-lime: #D4FF3A; /* appel à l'action principal et focus uniquement */
  --color-cyan: #35E0FF; /* palettes génératives */

  --fs-hero: clamp(2.25rem, 0.9rem + 7vw, 7.5rem);
  --fs-h1: clamp(2rem, 1.1rem + 4.5vw, 5rem);
  --fs-h2: clamp(1.625rem, 1.05rem + 2.6vw, 3.25rem);
  --fs-h3: clamp(1.25rem, 1rem + 1vw, 1.75rem);
  --fs-body: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --fs-lead: clamp(1.125rem, 1rem + 0.6vw, 1.5rem);
  --fs-small: 0.875rem;

  --space-xs: 0.5rem;
  --space-s: 1rem;
  --space-m: 1.5rem;
  --space-l: 3rem;
  --space-xl: clamp(4rem, 2rem + 8vw, 9rem);
  --gutter: clamp(1rem, 0.5rem + 3vw, 3rem);
  --max-width: 90rem;
  --measure: 38rem;
  --radius: 4px;

  --ease-pli: cubic-bezier(0.7, 0, 0.2, 1);
  --duree: 400ms;
}
```

- [ ] **Step 4 : Remplacer `src/styles/global.css`**

```css
@import './tokens.css';

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  color-scheme: dark;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--fs-body);
  line-height: 1.6;
  overflow-x: clip;
}

h1,
h2,
h3 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.03em;
  text-wrap: balance;
  /* Unbounded est très large : on autorise la césure pour tenir sur 320 px */
  overflow-wrap: break-word;
  hyphens: auto;
}

p {
  margin: 0;
  text-wrap: pretty;
}

ul,
ol {
  margin: 0;
  padding: 0;
}

img,
svg {
  display: block;
  max-width: 100%;
}

a {
  color: var(--color-link);
  text-underline-offset: 0.2em;
}

a:hover {
  color: var(--color-text);
}

:focus-visible {
  outline: 3px solid var(--color-lime);
  outline-offset: 3px;
}

.conteneur {
  width: min(100% - 2 * var(--gutter), var(--max-width));
  margin-inline: auto;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.exergue {
  color: var(--color-pink);
}

.chapo {
  max-width: var(--measure);
  color: var(--color-text-muted);
  font-size: var(--fs-lead);
  line-height: 1.45;
}

.bouton {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.9em 1.5em;
  border-radius: 999px;
  background: var(--color-lime);
  color: var(--color-bg);
  font-weight: 500;
  text-decoration: none;
  transition: transform var(--duree) var(--ease-pli);
}

.bouton:hover {
  color: var(--color-bg);
  transform: translateY(-2px) rotate(-1.5deg);
}

.prose {
  max-width: var(--measure);
}

.prose > * + * {
  margin-top: var(--space-s);
}

.prose h2 {
  margin-top: var(--space-l);
  font-size: var(--fs-h3);
  line-height: 1.1;
}

.prose strong {
  color: var(--color-pink);
  font-weight: 500;
}

/* Apparitions au scroll : CSS pur, contenu visible si non supporté ou mouvement réduit */
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .revele {
      animation: apparition linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 25%;
    }
  }
}

@keyframes apparition {
  from {
    opacity: 0;
    transform: translateY(2rem) rotateX(14deg);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
```

- [ ] **Step 5 : Créer `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://origami-digital.netlify.app/sitemap-index.xml
```

- [ ] **Step 6 : Consigner les décisions dans `docs/DECISIONS.md`** (ajouter à la fin)

```markdown
## 2026-09-25 — Direction « Néon plié » et approche web native

- **Décision** : identité sombre « Néon plié » (Unbounded + Inter, violet/rose/lime/cyan sur encre nuit). Effets en CSS 3D, SVG et API navigateur, sans WebGL ni bibliothèque d'animation.
- **Alternatives écartées** : directions « Papier & encre » et « Kami couleur » ; Three.js/OGL ; moteur Canvas 2D côté client.
- **Raison** : identité mémorable demandée ; poids minimal et approche cohérente avec la JAMstack. Voir `docs/superpowers/specs/2026-09-25-origami-digital-design.md`.

## 2026-09-25 — Polices auto-hébergées et sitemap

- **Décision** : polices via l'API `fonts` intégrée d'Astro (fournisseur Google, fichiers téléchargés au build et servis par le site) ; ajout de `@astrojs/sitemap` avec `site` = `https://origami-digital.netlify.app`.
- **Alternatives écartées** : lien direct vers Google Fonts (requête tierce, flash de police) ; paquets `@fontsource` (dépendances) ; sitemap écrit à la main.
- **Raison** : performance et vie privée sans dépendance pour les polices ; sitemap maintenu automatiquement pour une dépendance légère et officielle.
```

- [ ] **Step 7 : Vérifier**

Run : `npm run build`
Attendu : `Complete!`, aucune erreur. Puis :
Run : `ls dist/sitemap-index.xml dist/robots.txt`
Attendu : les deux fichiers existent.

- [ ] **Step 8 : Commit**

```bash
git add astro.config.mjs package.json package-lock.json src/styles public/robots.txt docs/DECISIONS.md
git commit -m "feat: pose les tokens, les polices et le sitemap"
```

---

### Task 2 : Moteur génératif `pli.ts` + `Pli.astro`

Branche : `feature/moteur-pli`

**Files :**
- Create : `src/components/generatif/pli.ts`, `src/components/generatif/Pli.astro`

**Interfaces :**
- Produces :
  - `type Point = [number, number]`
  - `interface Facette { points: [Point, Point, Point]; centre: Point; couleur: string }` (couleur finale, ombre déjà appliquée, format `#rrggbb`)
  - `interface Format { largeur: number; hauteur: number; colonnes: number; lignes: number; plis: number }`
  - `const FORMATS: { vignette; hero; avatar; feuille }` et `type NomFormat = keyof typeof FORMATS`
  - `function prng(seed: number): () => number`
  - `function genererPli(seed: number, palette: readonly string[], format: Format): { facettes: Facette[]; plis: Array<[Point, Point]> }` — lève une `Error` si la palette est vide ou si une couleur n'est pas au format `#RRGGBB`.
  - `function versPoints(points: readonly Point[]): string`
  - Composant `Pli.astro` : props `{ seed: number; palette: string[]; format: NomFormat; class?: string }` → `<svg aria-hidden="true">` remplissant son conteneur.

- [ ] **Step 1 : Créer la branche**

```bash
git switch develop && git switch -c feature/moteur-pli
```

- [ ] **Step 2 : Écrire `src/components/generatif/pli.ts`**

```ts
// Géométrie pure du moteur « Pli » : aucune dépendance au DOM.
// Utilisé au build par Pli.astro et côté client par FeuilleHero.vue.

export type Point = [number, number];

export interface Facette {
  points: [Point, Point, Point];
  centre: Point;
  /** Couleur finale (#rrggbb), ombre des plis déjà appliquée. */
  couleur: string;
}

export interface Format {
  largeur: number;
  hauteur: number;
  colonnes: number;
  lignes: number;
  plis: number;
}

export const FORMATS = {
  vignette: { largeur: 400, hauteur: 300, colonnes: 6, lignes: 4, plis: 2 },
  hero: { largeur: 1200, hauteur: 600, colonnes: 10, lignes: 5, plis: 3 },
  avatar: { largeur: 200, hauteur: 200, colonnes: 3, lignes: 3, plis: 1 },
  feuille: { largeur: 600, hauteur: 600, colonnes: 4, lignes: 4, plis: 2 },
} as const satisfies Record<string, Format>;

export type NomFormat = keyof typeof FORMATS;

const HEX = /^#[0-9a-fA-F]{6}$/;
const OMBRE_MAX = 0.45;

/** Générateur pseudo-aléatoire mulberry32 : même graine, même suite. */
export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function assombrir(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const canal = (decalage: number) => Math.round(((n >> decalage) & 255) * (1 - k));
  return '#' + [16, 8, 0].map((d) => canal(d).toString(16).padStart(2, '0')).join('');
}

function arrondi(v: number): number {
  return Math.round(v * 10) / 10;
}

export function genererPli(
  seed: number,
  palette: readonly string[],
  format: Format,
): { facettes: Facette[]; plis: Array<[Point, Point]> } {
  if (palette.length === 0) {
    throw new Error('genererPli : la palette doit contenir au moins une couleur');
  }
  const invalide = palette.find((c) => !HEX.test(c));
  if (invalide) {
    throw new Error(`genererPli : couleur invalide « ${invalide} » (format #RRGGBB attendu)`);
  }

  const r = prng(seed);
  const { largeur, hauteur, colonnes, lignes, plis } = format;
  const pasX = largeur / colonnes;
  const pasY = hauteur / lignes;

  // Grille perturbée : les bords restent droits pour remplir exactement le cadre
  const points: Point[] = [];
  for (let y = 0; y <= lignes; y++) {
    for (let x = 0; x <= colonnes; x++) {
      const bordX = x === 0 || x === colonnes;
      const bordY = y === 0 || y === lignes;
      points.push([
        arrondi(x * pasX + (bordX ? 0 : (r() - 0.5) * pasX * 0.7)),
        arrondi(y * pasY + (bordY ? 0 : (r() - 0.5) * pasY * 0.7)),
      ]);
    }
  }
  const P = (x: number, y: number): Point => points[y * (colonnes + 1) + x];

  // Plis : droites du bord haut au bord bas
  const droites: Array<[Point, Point]> = Array.from({ length: plis }, () => [
    [arrondi(r() * largeur), 0],
    [arrondi(r() * largeur), hauteur],
  ]);
  const cote = (p: Point, [a, b]: [Point, Point]) =>
    (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) > 0;

  const facettes: Facette[] = [];
  for (let y = 0; y < lignes; y++) {
    for (let x = 0; x < colonnes; x++) {
      const diagonale = r() > 0.5;
      const triangles: Array<[Point, Point, Point]> = diagonale
        ? [
            [P(x, y), P(x + 1, y), P(x + 1, y + 1)],
            [P(x, y), P(x + 1, y + 1), P(x, y + 1)],
          ]
        : [
            [P(x, y), P(x + 1, y), P(x, y + 1)],
            [P(x + 1, y), P(x + 1, y + 1), P(x, y + 1)],
          ];
      for (const t of triangles) {
        const centre: Point = [
          arrondi((t[0][0] + t[1][0] + t[2][0]) / 3),
          arrondi((t[0][1] + t[1][1] + t[2][1]) / 3),
        ];
        const base = palette[Math.floor(r() * palette.length)];
        const ombre = plis === 0 ? 0 : (droites.filter((d) => cote(centre, d)).length / plis) * OMBRE_MAX;
        facettes.push({ points: t, centre, couleur: assombrir(base, ombre) });
      }
    }
  }
  return { facettes, plis: droites };
}

export function versPoints(points: readonly Point[]): string {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}
```

- [ ] **Step 3 : Vérifier le module avec Node (déterminisme, bornes, erreurs)**

Node 24 exécute le TypeScript effaçable directement. Lancer depuis la racine :

```bash
node --input-type=module -e "
import { genererPli, FORMATS } from './src/components/generatif/pli.ts';
import assert from 'node:assert/strict';
const pal = ['#7B5CFF', '#FF5FA2', '#35E0FF'];
for (const [nom, f] of Object.entries(FORMATS)) {
  const a = genererPli(42, pal, f), b = genererPli(42, pal, f);
  assert.deepEqual(a, b, nom + ' : non déterministe');
  assert.equal(a.facettes.length, f.colonnes * f.lignes * 2, nom + ' : nombre de facettes');
  assert.equal(a.plis.length, f.plis);
  for (const t of a.facettes) {
    assert.match(t.couleur, /^#[0-9a-f]{6}$/);
    for (const [x, y] of t.points) assert.ok(x >= 0 && x <= f.largeur && y >= 0 && y <= f.hauteur, nom + ' : point hors cadre');
  }
}
assert.notDeepEqual(genererPli(1, pal, FORMATS.vignette), genererPli(2, pal, FORMATS.vignette), 'graines différentes = visuels différents');
assert.throws(() => genererPli(1, [], FORMATS.vignette), /au moins une couleur/);
assert.throws(() => genererPli(1, ['violet'], FORMATS.vignette), /couleur invalide/);
console.log('pli.ts OK');
"
```
Attendu : `pli.ts OK` (un avertissement expérimental de Node sur le type stripping est acceptable).

- [ ] **Step 4 : Écrire `src/components/generatif/Pli.astro`**

```astro
---
import { FORMATS, genererPli, versPoints, type NomFormat } from './pli';

interface Props {
  seed: number;
  palette: string[];
  format: NomFormat;
  class?: string;
}

const { seed, palette, format, class: classe } = Astro.props;
const f = FORMATS[format];
const { facettes, plis } = genererPli(seed, palette, f);
---

<svg
  class:list={['pli', classe]}
  viewBox={`0 0 ${f.largeur} ${f.hauteur}`}
  preserveAspectRatio="xMidYMid slice"
  aria-hidden="true"
  focusable="false"
>
  {
    facettes.map((t) => (
      <polygon points={versPoints(t.points)} fill={t.couleur} stroke={t.couleur} stroke-width="0.6" />
    ))
  }
  {
    plis.map(([a, b]) => (
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} class="pli__arete" />
    ))
  }
</svg>

<style>
  .pli {
    width: 100%;
    height: 100%;
  }

  .pli__arete {
    stroke: rgb(255 255 255 / 0.35);
    stroke-width: 1.2;
    vector-effect: non-scaling-stroke;
  }
</style>
```

(Le `stroke` de même couleur que la facette masque les fines lignes d'anticrénelage entre facettes voisines.)

- [ ] **Step 5 : Vérifier le rendu au build**

Remplacer temporairement le `<p>Site en construction.</p>` de `src/pages/index.astro` par :

```astro
<div style="width: 400px; height: 300px"><Pli seed={7} palette={['#7B5CFF', '#FF5FA2', '#35E0FF']} format="vignette" /></div>
```
et ajouter `import Pli from '../components/generatif/Pli.astro';` dans le frontmatter.

Run : `npm run build && grep -o '<polygon' dist/index.html | wc -l`
Attendu : `48` (6 × 4 × 2).
Puis **annuler** cette modification : `git checkout src/pages/index.astro`.

- [ ] **Step 6 : Commit**

```bash
git add src/components/generatif
git commit -m "feat: ajoute le moteur génératif Pli"
```

---

### Task 3 : Layout, navigation et transitions « pli »

Branche : `feature/layout`

**Files :**
- Create : `src/transitions/pli.ts`, `src/components/SkipLink.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/islands/MenuMobile.vue`
- Modify : `src/layouts/BaseLayout.astro` (remplacement), `src/styles/global.css` (ajout en fin), `src/pages/index.astro` (provisoire)

**Interfaces :**
- Consumes : tokens et classes de la Tâche 1.
- Produces :
  - `BaseLayout.astro` props `{ title: string; description: string; noindex?: boolean }`. `title` = titre court de la page (« Projets ») ; la page d'accueil passe `title="Origami Digital"`. Le contenu de la page est placé dans `<main id="contenu">`.
  - `export const pli: TransitionDirectionalAnimations` (depuis `src/transitions/pli.ts`).
  - `MenuMobile.vue` props `{ liens: { href: string; label: string }[]; chemin: string }`.
  - Adresse de contact fictive utilisée partout : `bonjour@origami-digital.example` ; adresse postale : `12 rue des Plieurs, 69001 Lyon`.

- [ ] **Step 1 : Créer la branche**

```bash
git switch develop && git switch -c feature/layout
```

- [ ] **Step 2 : Écrire `src/transitions/pli.ts`**

```ts
import type { TransitionAnimation, TransitionDirectionalAnimations } from 'astro';

// Les keyframes sont dans src/styles/global.css.
// Sous prefers-reduced-motion, Astro coupe toutes les animations de transition.
const animation = (name: string): TransitionAnimation => ({
  name,
  duration: '0.6s',
  easing: 'cubic-bezier(0.7, 0, 0.2, 1)',
  fillMode: 'both',
});

export const pli: TransitionDirectionalAnimations = {
  forwards: { old: animation('pli-replie'), new: animation('pli-deplie') },
  backwards: { old: animation('pli-replie-retour'), new: animation('pli-deplie-retour') },
};
```

- [ ] **Step 3 : Ajouter les keyframes à la fin de `src/styles/global.css`**

```css
/* Transition de page « pli » : l'ancienne page se replie en diagonale, la nouvelle se déplie */
@keyframes pli-replie {
  from {
    transform-origin: 0 0;
  }
  to {
    transform-origin: 0 0;
    transform: perspective(1400px) rotate3d(1, -1, 0, 75deg) scale(0.9);
    opacity: 0;
  }
}

@keyframes pli-deplie {
  from {
    transform-origin: 100% 100%;
    transform: perspective(1400px) rotate3d(1, -1, 0, -75deg) scale(0.9);
    opacity: 0;
  }
  to {
    transform-origin: 100% 100%;
  }
}

@keyframes pli-replie-retour {
  from {
    transform-origin: 100% 100%;
  }
  to {
    transform-origin: 100% 100%;
    transform: perspective(1400px) rotate3d(1, -1, 0, -75deg) scale(0.9);
    opacity: 0;
  }
}

@keyframes pli-deplie-retour {
  from {
    transform-origin: 0 0;
    transform: perspective(1400px) rotate3d(1, -1, 0, 75deg) scale(0.9);
    opacity: 0;
  }
  to {
    transform-origin: 0 0;
  }
}
```

- [ ] **Step 4 : Écrire `src/components/SkipLink.astro`**

```astro
<a class="lien-evitement" href="#contenu">Aller au contenu</a>

<style>
  .lien-evitement {
    position: absolute;
    top: var(--space-xs);
    left: var(--space-xs);
    z-index: 100;
    padding: 0.6em 1em;
    background: var(--color-lime);
    color: var(--color-bg);
    font-weight: 500;
    transform: translateY(-200%);
  }

  .lien-evitement:focus {
    transform: none;
  }
</style>
```

- [ ] **Step 5 : Écrire `src/components/islands/MenuMobile.vue`**

```vue
<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

interface Lien {
  href: string;
  label: string;
}

const props = defineProps<{ liens: Lien[]; chemin: string }>();

const ouvert = ref(false);
const bouton = ref<HTMLButtonElement | null>(null);
const panneau = ref<HTMLElement | null>(null);

const sansBarre = (p: string) => p.replace(/\/+$/, '') || '/';
const estActif = (href: string) => {
  const c = sansBarre(props.chemin);
  const h = sansBarre(href);
  return c === h || c.startsWith(h + '/');
};

function focusables(): HTMLElement[] {
  return panneau.value ? Array.from(panneau.value.querySelectorAll<HTMLElement>('a[href]')) : [];
}

function fermer(rendreFocus = true) {
  ouvert.value = false;
  if (rendreFocus) nextTick(() => bouton.value?.focus());
}

// Piège de focus : le bouton (au-dessus du panneau) et les liens du panneau
function surTouche(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault();
    fermer();
    return;
  }
  if (e.key !== 'Tab') return;
  const elements = [bouton.value, ...focusables()].filter((el): el is HTMLElement => el !== null);
  const premier = elements[0];
  const dernier = elements[elements.length - 1];
  if (e.shiftKey && document.activeElement === premier) {
    e.preventDefault();
    dernier.focus();
  } else if (!e.shiftKey && document.activeElement === dernier) {
    e.preventDefault();
    premier.focus();
  }
}

watch(ouvert, (estOuvert) => {
  document.documentElement.style.overflow = estOuvert ? 'hidden' : '';
  if (estOuvert) {
    document.addEventListener('keydown', surTouche);
    nextTick(() => focusables()[0]?.focus());
  } else {
    document.removeEventListener('keydown', surTouche);
  }
});

// Navigation par View Transitions : l'îlot est démonté, on libère toujours le défilement
onBeforeUnmount(() => {
  document.documentElement.style.overflow = '';
  document.removeEventListener('keydown', surTouche);
});
</script>

<template>
  <div class="menu-mobile">
    <button
      ref="bouton"
      type="button"
      class="menu-mobile__bouton"
      :aria-expanded="ouvert"
      aria-controls="menu-mobile-panneau"
      @click="ouvert = !ouvert"
    >
      {{ ouvert ? 'Fermer' : 'Menu' }}
    </button>
    <div id="menu-mobile-panneau" ref="panneau" class="menu-mobile__panneau" :hidden="!ouvert">
      <nav aria-label="Navigation principale">
        <ul>
          <li v-for="lien in liens" :key="lien.href">
            <a :href="lien.href" :aria-current="estActif(lien.href) ? 'page' : undefined" @click="fermer(false)">
              {{ lien.label }}
            </a>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.menu-mobile {
  display: none;
}

@media (max-width: 47.99rem) {
  .menu-mobile {
    display: block;
  }
}

.menu-mobile__bouton {
  position: relative;
  z-index: 60;
  padding: 0.5em 1.1em;
  border: 1px solid var(--color-line);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.menu-mobile__panneau {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  background: var(--color-bg);
}

.menu-mobile__panneau[hidden] {
  display: none;
}

.menu-mobile__panneau ul {
  list-style: none;
  display: grid;
  gap: var(--space-m);
  text-align: center;
}

.menu-mobile__panneau a {
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: var(--fs-h2);
  text-decoration: none;
}

.menu-mobile__panneau a[aria-current='page'] {
  color: var(--color-pink);
}
</style>
```

- [ ] **Step 6 : Écrire `src/components/Header.astro`**

```astro
---
import MenuMobile from './islands/MenuMobile.vue';

const liens = [
  { href: '/projets/', label: 'Projets' },
  { href: '/studio/', label: 'Studio' },
  { href: '/contact/', label: 'Contact' },
];
const chemin = Astro.url.pathname;
const sansBarre = (p: string) => p.replace(/\/+$/, '') || '/';
const estActif = (href: string) => {
  const c = sansBarre(chemin);
  const h = sansBarre(href);
  return c === h || c.startsWith(h + '/');
};
---

<header class="entete">
  <div class="conteneur entete__barre">
    <a href="/" class="logo">
      <svg class="logo__marque" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <polygon points="4,28 16,4 16,20" fill="#7B5CFF"></polygon>
        <polygon points="16,4 28,28 16,20" fill="#FF5FA2"></polygon>
        <polygon points="4,28 16,20 28,28" fill="#D4FF3A"></polygon>
      </svg>
      <span>Origami Digital</span>
    </a>
    <nav class="nav-bureau" aria-label="Navigation principale">
      <ul>
        {
          liens.map((lien) => (
            <li>
              <a href={lien.href} aria-current={estActif(lien.href) ? 'page' : undefined}>
                {lien.label}
              </a>
            </li>
          ))
        }
      </ul>
    </nav>
    <MenuMobile client:idle liens={liens} chemin={chemin} />
  </div>
</header>

<style>
  .entete {
    position: relative;
    z-index: 10;
  }

  .entete__barre {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-block: var(--space-m);
  }

  .logo {
    display: inline-flex;
    align-items: center;
    gap: 0.6em;
    color: var(--color-text);
    font-family: var(--font-display);
    font-size: 0.95rem;
    letter-spacing: 0.04em;
    text-decoration: none;
    text-transform: uppercase;
  }

  .logo__marque {
    width: 1.75rem;
    height: 1.75rem;
    transition: transform var(--duree) var(--ease-pli);
  }

  .logo:hover .logo__marque {
    transform: rotate(-12deg) scale(1.1);
  }

  .nav-bureau ul {
    list-style: none;
    display: flex;
    gap: var(--space-l);
  }

  .nav-bureau a {
    color: var(--color-text-muted);
    text-decoration: none;
  }

  .nav-bureau a:hover,
  .nav-bureau a[aria-current='page'] {
    color: var(--color-text);
  }

  .nav-bureau a[aria-current='page'] {
    text-decoration: underline;
    text-decoration-color: var(--color-pink);
    text-decoration-thickness: 2px;
  }

  @media (max-width: 47.99rem) {
    .nav-bureau {
      display: none;
    }
  }
</style>
```

- [ ] **Step 7 : Écrire `src/components/Footer.astro`**

```astro
---
const annee = new Date().getFullYear();
---

<footer class="pied">
  <div class="conteneur pied__grille">
    <p class="pied__signature">On plie le web <span class="exergue">à vos idées.</span></p>
    <div>
      <p><a href="mailto:bonjour@origami-digital.example">bonjour@origami-digital.example</a></p>
      <p class="pied__adresse">12 rue des Plieurs, 69001 Lyon</p>
    </div>
    <p class="pied__mentions">© {annee} Origami Digital · Agence fictive, projet WR505</p>
  </div>
</footer>

<style>
  .pied {
    margin-top: var(--space-xl);
    border-top: 1px solid var(--color-line);
  }

  .pied__grille {
    display: grid;
    gap: var(--space-m);
    padding-block: var(--space-l);
  }

  @media (min-width: 48rem) {
    .pied__grille {
      grid-template-columns: 2fr 1fr;
    }
  }

  .pied__signature {
    font-family: var(--font-display);
    font-size: var(--fs-h3);
    line-height: 1.1;
  }

  .pied__adresse,
  .pied__mentions {
    color: var(--color-text-muted);
    font-size: var(--fs-small);
  }

  .pied__mentions {
    grid-column: 1 / -1;
  }
</style>
```

- [ ] **Step 8 : Remplacer `src/layouts/BaseLayout.astro`**

```astro
---
import { ClientRouter } from 'astro:transitions';
import { Font } from 'astro:assets';
import '../styles/global.css';
import SkipLink from '../components/SkipLink.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import { pli } from '../transitions/pli';

interface Props {
  /** Titre court de la page ; « Origami Digital » pour l'accueil. */
  title: string;
  description: string;
  noindex?: boolean;
}

const { title, description, noindex = false } = Astro.props;
const titreComplet = title === 'Origami Digital' ? 'Origami Digital · Studio web expérimental' : `${title} · Origami Digital`;
const canonique = new URL(Astro.url.pathname, Astro.site);
---

<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{titreComplet}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonique} />
    {noindex && <meta name="robots" content="noindex" />}
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="fr_FR" />
    <meta property="og:site_name" content="Origami Digital" />
    <meta property="og:title" content={titreComplet} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonique} />
    <meta name="theme-color" content="#0D0D12" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" href="/favicon.ico" />
    <link rel="sitemap" href="/sitemap-index.xml" />
    <meta name="generator" content={Astro.generator} />
    <Font cssVariable="--font-display" preload />
    <Font cssVariable="--font-body" preload />
    <ClientRouter />
  </head>
  <body>
    <SkipLink />
    <Header />
    <main id="contenu" transition:animate={pli}>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 9 : Mettre à jour la page d'accueil provisoire `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Origami Digital" description="Studio web expérimental : sites, identités et interfaces qui se déplient au fil du regard.">
  <section class="conteneur">
    <h1>On plie le web <span class="exergue">à vos idées.</span></h1>
  </section>
</BaseLayout>
```

- [ ] **Step 10 : Vérifier**

Run : `npm run build`
Attendu : `Complete!`. Puis :
Run : `grep -c 'font-family' dist/index.html; grep -o 'rel="canonical" href="[^"]*"' dist/index.html; grep -o 'astro-island[^>]*MenuMobile' dist/index.html | head -1; ls dist/_astro/*.woff2 | head -3`
Attendu : au moins 1 `font-family` (CSS des polices en ligne), `href="https://origami-digital.netlify.app/"`, un îlot `MenuMobile`, des fichiers `.woff2` servis par le site.

Contrôle navigateur (`npm run dev`, largeur 375 px) : le bouton « Menu » ouvre un panneau plein écran ; Tab reste dans le menu ; Échap le ferme et rend le focus au bouton ; le lien d'évitement apparaît au premier Tab.

- [ ] **Step 11 : Commit**

```bash
git add src
git commit -m "feat: ajoute le layout, la navigation et la transition pli"
```

---

### Task 4 : Collections de contenu

Branche : `feature/contenu`

**Files :**
- Create : `src/content.config.ts`, `src/lib/contenu.ts`, `src/content/projets/*.md` (6), `src/content/services/*.md` (4), `src/content/equipe/*.md` (4)
- Delete : `src/content/.gitkeep`

**Interfaces :**
- Produces :
  - Collections `projets`, `services`, `equipe` (schémas ci-dessous). Les `id` des projets sont les noms de fichiers : `maree-haute`, `atelier-sillon`, `relais`, `opus-cinq`, `verger-commun`, `kori`.
  - `src/lib/contenu.ts` :
    - `type Discipline = 'site' | 'identité' | 'interface' | 'expérience'`
    - `const LIBELLES_DISCIPLINES: Record<Discipline, string>`
    - `const PALETTE_EQUIPE: string[]`
    - `projetsTries(): Promise<CollectionEntry<'projets'>[]>`
    - `servicesTries(): Promise<CollectionEntry<'services'>[]>`
    - `equipeTriee(): Promise<CollectionEntry<'equipe'>[]>`
    - `projetSuivant<T extends { id: string }>(liste: T[], id: string): T`

- [ ] **Step 1 : Créer la branche**

```bash
git switch develop && git switch -c feature/contenu && git rm -q src/content/.gitkeep
```

- [ ] **Step 2 : Écrire `src/content.config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const couleur = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'couleur hexadécimale attendue (#RRGGBB)');

const projets = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projets' }),
  schema: z.object({
    title: z.string(),
    client: z.string(),
    year: z.number().int().min(2000).max(2100),
    disciplines: z.array(z.enum(['site', 'identité', 'interface', 'expérience'])).min(1),
    summary: z.string().max(160),
    seed: z.number().int().nonnegative(),
    palette: z.array(couleur).length(3),
    featured: z.boolean().default(false),
    order: z.number().int(),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    deliverables: z.array(z.string()).min(1),
    order: z.number().int(),
  }),
});

const equipe = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/equipe' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    seed: z.number().int().nonnegative(),
    order: z.number().int(),
  }),
});

export const collections = { projets, services, equipe };
```

- [ ] **Step 3 : Écrire `src/lib/contenu.ts`**

```ts
import { getCollection, type CollectionEntry } from 'astro:content';

export type Discipline = CollectionEntry<'projets'>['data']['disciplines'][number];

export const LIBELLES_DISCIPLINES: Record<Discipline, string> = {
  site: 'Site',
  identité: 'Identité',
  interface: 'Interface',
  expérience: 'Expérience',
};

/** Palette commune des portraits génératifs de l'équipe. */
export const PALETTE_EQUIPE = ['#7B5CFF', '#FF5FA2', '#35E0FF'];

export async function projetsTries() {
  return (await getCollection('projets')).sort((a, b) => a.data.order - b.data.order);
}

export async function servicesTries() {
  return (await getCollection('services')).sort((a, b) => a.data.order - b.data.order);
}

export async function equipeTriee() {
  return (await getCollection('equipe')).sort((a, b) => a.data.order - b.data.order);
}

/** Projet suivant dans la liste, en bouclant sur le premier. */
export function projetSuivant<T extends { id: string }>(liste: T[], id: string): T {
  const i = liste.findIndex((p) => p.id === id);
  return liste[(i + 1) % liste.length];
}
```

- [ ] **Step 4 : Écrire les 6 projets**

`src/content/projets/maree-haute.md`

```markdown
---
title: Marée Haute
client: Festival Marée Haute
year: 2026
disciplines: [site, expérience]
summary: Un site de festival électro qui monte comme la marée, au rythme du line-up.
seed: 1107
palette: ['#7B5CFF', '#35E0FF', '#1B1840']
featured: true
order: 1
---

## Contexte

Marée Haute réunit chaque été 12 000 personnes sur le port de Brest pour trois nuits de musique électronique. Leur ancien site ressemblait à une billetterie : efficace, mais sans aucune vibration.

## Enjeu

Donner envie avant même la première note, vendre les pass plus tôt, et tenir la charge le soir de l'annonce du line-up.

## Réponse

Nous avons plié le site autour d'une idée : la page monte comme l'eau. Chaque artiste révélé fait gagner quelques pixels à une marée de facettes violettes qui recouvre peu à peu l'écran. Le site est entièrement statique, la billetterie reste chez leur prestataire.

## Résultats

**+38 %** de pass vendus pendant la première semaine, et un site qui a encaissé **40 000 visites** en une heure sans broncher.
```

`src/content/projets/atelier-sillon.md`

```markdown
---
title: Atelier Sillon
client: Atelier Sillon, céramiste
year: 2025
disciplines: [identité, site]
summary: Identité et boutique en ligne pour une céramiste lyonnaise qui tourne des pièces uniques.
seed: 2211
palette: ['#FF5FA2', '#FFB86B', '#2A1830']
featured: true
order: 2
---

## Contexte

Camille Sillon façonne des bols et des vases uniques dans son atelier de la Croix-Rousse. Jusqu'ici, tout passait par Instagram et des messages privés.

## Enjeu

Vendre en ligne sans perdre la chaleur de l'atelier, et présenter des pièces qui n'existent chacune qu'en un seul exemplaire.

## Réponse

Une identité inspirée des sillons du tour : un monogramme tracé d'un seul geste, une palette terre cuite et rose. La boutique affiche chaque pièce comme une œuvre, avec son histoire et le temps passé à la faire.

## Résultats

Les collections se vendent désormais en **moins de 48 heures**, et **60 %** des commandes viennent de nouveaux clients.
```

`src/content/projets/relais.md`

```markdown
---
title: Relais
client: Relais, covoiturage rural
year: 2025
disciplines: [interface]
summary: Une appli de covoiturage pensée pour les villages, là où le bus passe deux fois par jour.
seed: 3490
palette: ['#D4FF3A', '#7B5CFF', '#14132A']
featured: true
order: 3
---

## Contexte

Relais met en relation les habitants de 40 communes de la Drôme pour partager leurs trajets du quotidien : marché, médecin, gare.

## Enjeu

Une interface utilisable par tout le monde, y compris par des personnes de plus de 70 ans peu à l'aise avec le téléphone.

## Réponse

Trois écrans, pas un de plus : « Je pars », « Je cherche », « Mes trajets ». Des boutons immenses, des textes clairs, et un mode appel pour réserver par téléphone. Chaque écran a été testé en mairie avec de vrais habitants.

## Résultats

**1 200 trajets** partagés le premier trimestre, et une note de satisfaction de **4,8/5** chez les plus de 65 ans.
```

`src/content/projets/opus-cinq.md`

```markdown
---
title: Opus Cinq
client: Ensemble Opus Cinq
year: 2024
disciplines: [identité, site]
summary: Une identité vivante pour un quintette de musique de chambre qui refuse les codes poussiéreux.
seed: 4588
palette: ['#FF5FA2', '#7B5CFF', '#0F1A3A']
order: 4
---

## Contexte

Cinq musiciennes et musiciens qui jouent Ravel dans des salles de concert comme dans des bars. Leur image, elle, restait figée dans le velours rouge.

## Enjeu

Attirer un public de moins de 35 ans sans perdre les fidèles de la musique classique.

## Réponse

Un logo en cinq facettes qui se réorganise à chaque programme, comme une partition qui change de forme. Le site présente les concerts comme des sorties, pas comme des cours d'histoire de la musique.

## Résultats

La part des spectateurs de moins de 35 ans est passée de **12 %** à **31 %** en une saison.
```

`src/content/projets/verger-commun.md`

```markdown
---
title: Verger Commun
client: Coopérative Verger Commun
year: 2024
disciplines: [site]
summary: Le site d'une coopérative fruitière qui vend en circuit court, de l'arbre au panier.
seed: 5023
palette: ['#D4FF3A', '#35E0FF', '#12201C']
order: 5
---

## Contexte

Vingt-trois arboriculteurs de l'Ardèche se sont regroupés pour vendre directement leurs fruits aux habitants et aux cantines scolaires.

## Enjeu

Expliquer simplement le fonctionnement de la coopérative et rendre les points de retrait faciles à trouver.

## Réponse

Un site léger qui suit les saisons : la page d'accueil change de fruit vedette chaque mois, et une carte liste les quinze points de retrait avec leurs horaires. Les producteurs mettent à jour les stocks eux-mêmes.

## Résultats

**+45 %** de paniers commandés en un an, et **9 cantines** partenaires de plus.
```

`src/content/projets/kori.md`

```markdown
---
title: Kōri
client: Kōri, glaces artisanales
year: 2023
disciplines: [expérience, identité]
summary: Une expérience web givrée pour une marque de glaces japonaises au matcha et au yuzu.
seed: 6874
palette: ['#35E0FF', '#FF5FA2', '#101828']
order: 6
---

## Contexte

Kōri (« glace » en japonais) fabrique des glaces aux saveurs japonaises dans un petit laboratoire nantais et ouvrait sa première boutique.

## Enjeu

Faire parler de l'ouverture au-delà du quartier, avec un budget très serré.

## Réponse

Une page d'ouverture où chaque parfum se présente comme un cristal de glace qui se fend au passage de la souris. Nous avons aussi dessiné l'identité : un idéogramme stylisé, du bleu glacier et du rose sakura.

## Résultats

**3 200 partages** sur les réseaux la semaine de l'ouverture, et une file d'attente qui a fait le tour du pâté de maisons.
```

- [ ] **Step 5 : Écrire les 4 services** (frontmatter seul)

`src/content/services/sites.md`

```markdown
---
title: Sites & boutiques
description: Des sites rapides et vivants, du site vitrine à la boutique en ligne, pensés pour être trouvés et pour convertir.
deliverables: [Site vitrine, E-commerce, Refonte, Référencement technique]
order: 1
---
```

`src/content/services/identites.md`

```markdown
---
title: Identités visuelles
description: Un nom, un logo, une typo, des couleurs : un système cohérent qui tient sur un écran comme sur une affiche.
deliverables: [Logo, Charte graphique, Système typographique, Déclinaisons]
order: 2
---
```

`src/content/services/interfaces.md`

```markdown
---
title: Interfaces & produits
description: Des applications et des outils simples à prendre en main, testés avec les personnes qui s'en serviront vraiment.
deliverables: [Parcours utilisateur, Maquettes interactives, Design system, Tests utilisateurs]
order: 3
---
```

`src/content/services/experiences.md`

```markdown
---
title: Expériences interactives
description: Des pages qui surprennent et qu'on partage : lancements, campagnes, événements, installations.
deliverables: [Sites événementiels, Animations, Prototypes créatifs, Microsites de campagne]
order: 4
---
```

- [ ] **Step 6 : Écrire les 4 membres de l'équipe**

`src/content/equipe/iris-kawano.md`

```markdown
---
name: Iris Kawano
role: Directrice de création
bio: Iris a fondé Origami Digital après dix ans en agence de publicité. Elle plie chaque idée jusqu'à ce qu'elle tienne debout toute seule.
seed: 111
order: 1
---
```

`src/content/equipe/malo-tessier.md`

```markdown
---
name: Malo Tessier
role: Développeur créatif
bio: Malo transforme les maquettes en pages qui bougent. Il ne jure que par le HTML propre et les animations qui servent à quelque chose.
seed: 222
order: 2
---
```

`src/content/equipe/nour-benali.md`

```markdown
---
name: Nour Benali
role: Designer d'interface
bio: Nour passe plus de temps avec les utilisateurs qu'avec son logiciel de maquette. Ses interfaces se comprennent sans mode d'emploi.
seed: 333
order: 3
---
```

`src/content/equipe/jules-fontaine.md`

```markdown
---
name: Jules Fontaine
role: Chef·fe de projet
bio: Jules tient les délais, les budgets et le moral des troupes. Rien ne se déplie sans passer par son tableau de bord.
seed: 444
order: 4
---
```

- [ ] **Step 7 : Vérifier la validation des schémas**

Run : `npm run build`
Attendu : `Complete!` sans erreur de contenu.

Puis vérifier qu'une donnée invalide casse le build : remplacer temporairement dans `kori.md` la ligne `palette` par `palette: ['#35E0FF', 'rose']`.
Run : `npm run build`
Attendu : échec avec un message contenant `couleur hexadécimale attendue`.
Annuler en rétablissant à la main la ligne d'origine `palette: ['#35E0FF', '#FF5FA2', '#101828']` (le fichier n'est pas encore commité), puis relancer `npm run build` → `Complete!`.

- [ ] **Step 8 : Commit**

```bash
git add src/content.config.ts src/lib src/content
git commit -m "feat: ajoute les collections projets, services et équipe"
```

---

### Task 5 : Fusion du socle

Branche : aucune nouvelle.

- [ ] **Step 1 : Relecture croisée et fusion des Tâches 1 à 4**

Chaque branche `feature/fondations`, `feature/moteur-pli`, `feature/layout`, `feature/contenu` est relue (diff + objectif, contexte neuf) puis fusionnée dans l'ordre :

```bash
git switch develop
git merge --no-ff feature/fondations -m "chore: fusionne feature/fondations dans develop"
git merge --no-ff feature/moteur-pli -m "chore: fusionne feature/moteur-pli dans develop"
git merge --no-ff feature/layout -m "chore: fusionne feature/layout dans develop"
git merge --no-ff feature/contenu -m "chore: fusionne feature/contenu dans develop"
npm run build
```
Attendu : `Complete!`. (Si les tâches sont exécutées séquentiellement, chaque branche est fusionnée juste après sa relecture et la tâche suivante part de `develop` à jour.)

---

### Task 6 : Pages Projets (liste filtrable + études de cas)

Branche : `feature/projets` (parallélisable avec 7 et 8)

**Files :**
- Create : `src/components/CarteProjet.astro`, `src/components/islands/FiltreProjets.vue`, `src/pages/projets/index.astro`, `src/pages/projets/[slug].astro`
- Modify : `docs/DECISIONS.md`

**Interfaces :**
- Consumes : `Pli.astro` (T2), `BaseLayout` (T3), `projetsTries`, `projetSuivant`, `LIBELLES_DISCIPLINES`, `Discipline` (T4).
- Produces : `CarteProjet.astro` props `{ projet: CollectionEntry<'projets'>; niveau?: 'h2' | 'h3' }` ; le visuel porte `transition:name={`visuel-${projet.id}`}` (repris par la page projet pour la transformation vignette → hero).

- [ ] **Step 1 : Créer la branche**

```bash
git switch develop && git switch -c feature/projets
```

- [ ] **Step 2 : Écrire `src/components/CarteProjet.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import Pli from './generatif/Pli.astro';
import { LIBELLES_DISCIPLINES } from '../lib/contenu';

interface Props {
  projet: CollectionEntry<'projets'>;
  niveau?: 'h2' | 'h3';
}

const { projet, niveau = 'h3' } = Astro.props;
const { title, client, year, disciplines, seed, palette } = projet.data;
const Titre = niveau;
---

<article class="carte-projet" style={`--pli-couleur: ${palette[1]}`}>
  <a href={`/projets/${projet.id}/`} class="carte-projet__lien">
    <div class="carte-projet__visuel" transition:name={`visuel-${projet.id}`}>
      <Pli seed={seed} palette={palette} format="vignette" />
    </div>
    <div class="carte-projet__texte">
      <Titre class="carte-projet__titre">{title}</Titre>
      <p class="carte-projet__meta">{client} · {year}</p>
      <ul class="carte-projet__disciplines" aria-label="Disciplines">
        {disciplines.map((d) => <li>{LIBELLES_DISCIPLINES[d]}</li>)}
      </ul>
    </div>
  </a>
</article>

<style>
  .carte-projet__lien {
    display: grid;
    gap: var(--space-s);
    color: inherit;
    text-decoration: none;
  }

  .carte-projet__visuel {
    position: relative;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: var(--radius);
  }

  /* Coin qui se replie au survol et révèle la couleur suivante de la palette */
  .carte-projet__visuel::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 0;
    aspect-ratio: 1;
    background: linear-gradient(225deg, var(--color-bg) 50%, var(--pli-couleur) 50%);
    box-shadow: -6px 6px 14px rgb(0 0 0 / 0.35);
    transition: width var(--duree) var(--ease-pli);
  }

  .carte-projet__lien:hover .carte-projet__visuel::after,
  .carte-projet__lien:focus-visible .carte-projet__visuel::after {
    width: 22%;
  }

  @media (prefers-reduced-motion: reduce) {
    .carte-projet__visuel::after {
      transition: none;
    }
  }

  .carte-projet__titre {
    font-size: var(--fs-h3);
    line-height: 1.05;
  }

  .carte-projet__lien:hover .carte-projet__titre {
    color: var(--color-pink);
  }

  .carte-projet__meta {
    color: var(--color-text-muted);
    font-size: var(--fs-small);
  }

  .carte-projet__disciplines {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .carte-projet__disciplines li {
    padding: 0.15em 0.7em;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    color: var(--color-text-muted);
    font-size: var(--fs-small);
  }
</style>
```

- [ ] **Step 3 : Écrire `src/components/islands/FiltreProjets.vue`**

Le filtre agit sur la grille rendue par Astro (les cartes contiennent des SVG générés au build, que Vue ne peut pas produire). Il n'apparaît qu'une fois monté : sans JavaScript, tous les projets restent visibles et aucun bouton inutile n'est affiché.

```vue
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

interface Option {
  valeur: string;
  libelle: string;
}

const props = defineProps<{ options: Option[]; cible: string; total: number }>();

const monte = ref(false);
const actif = ref<string | null>(null);
const visibles = ref(props.total);

function appliquer() {
  const grille = document.getElementById(props.cible);
  if (!grille) return;
  let n = 0;
  grille.querySelectorAll<HTMLElement>('[data-disciplines]').forEach((el) => {
    const correspond = actif.value === null || (el.dataset.disciplines ?? '').split(' ').includes(actif.value);
    el.hidden = !correspond;
    if (correspond) n++;
  });
  visibles.value = n;
}

watch(actif, appliquer);
onMounted(() => {
  monte.value = true;
  appliquer();
});

const annonce = computed(() =>
  visibles.value === 0
    ? 'Aucun projet pour ce filtre.'
    : `${visibles.value} projet${visibles.value > 1 ? 's' : ''} affiché${visibles.value > 1 ? 's' : ''}.`,
);
</script>

<template>
  <div v-if="monte" class="filtre" role="group" aria-label="Filtrer les projets par discipline">
    <button type="button" :aria-pressed="actif === null" @click="actif = null">Tous</button>
    <button
      v-for="option in options"
      :key="option.valeur"
      type="button"
      :aria-pressed="actif === option.valeur"
      @click="actif = actif === option.valeur ? null : option.valeur"
    >
      {{ option.libelle }}
    </button>
  </div>
  <p class="visually-hidden" aria-live="polite">{{ monte ? annonce : '' }}</p>
</template>

<style scoped>
.filtre {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.filtre button {
  padding: 0.5em 1.1em;
  border: 1px solid var(--color-line);
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  cursor: pointer;
  transition: background-color var(--duree) var(--ease-pli), color var(--duree) var(--ease-pli);
}

.filtre button:hover {
  color: var(--color-text);
}

.filtre button[aria-pressed='true'] {
  border-color: var(--color-pink);
  background: var(--color-pink);
  color: var(--color-bg);
}
</style>
```

- [ ] **Step 4 : Écrire `src/pages/projets/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import CarteProjet from '../../components/CarteProjet.astro';
import FiltreProjets from '../../components/islands/FiltreProjets.vue';
import { LIBELLES_DISCIPLINES, projetsTries, type Discipline } from '../../lib/contenu';

const projets = await projetsTries();
const presentes = new Set(projets.flatMap((p) => p.data.disciplines));
const options = (Object.keys(LIBELLES_DISCIPLINES) as Discipline[])
  .filter((d) => presentes.has(d))
  .map((d) => ({ valeur: d, libelle: LIBELLES_DISCIPLINES[d] }));
---

<BaseLayout
  title="Projets"
  description="Sites, identités, interfaces et expériences : six projets pliés sur mesure par Origami Digital."
>
  <section class="conteneur entete-page">
    <h1>Projets <span class="exergue">pliés</span> sur mesure</h1>
    <p class="chapo">Festivals, artisans, coopératives, applis de village : chaque projet a sa forme, et chaque forme a sa raison.</p>
    <FiltreProjets client:idle options={options} cible="grille-projets" total={projets.length} />
  </section>

  <ul id="grille-projets" class="conteneur grille-projets" role="list">
    {
      projets.map((projet) => (
        <li class="revele" data-disciplines={projet.data.disciplines.join(' ')}>
          <CarteProjet projet={projet} niveau="h2" />
        </li>
      ))
    }
  </ul>
</BaseLayout>

<style>
  .entete-page {
    display: grid;
    gap: var(--space-m);
    padding-block: var(--space-l);
  }

  .entete-page h1 {
    font-size: var(--fs-h1);
  }

  .grille-projets {
    list-style: none;
    display: grid;
    gap: var(--space-l) var(--space-m);
  }

  @media (min-width: 48rem) {
    .grille-projets {
      grid-template-columns: repeat(2, 1fr);
    }

    /* Grille asymétrique : la colonne de droite est décalée vers le bas */
    .grille-projets > li:nth-child(even) {
      margin-top: var(--space-xl);
    }
  }

  .grille-projets > li[hidden] {
    display: none;
  }
</style>
```

- [ ] **Step 5 : Écrire `src/pages/projets/[slug].astro`**

```astro
---
import type { GetStaticPaths } from 'astro';
import { render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import Pli from '../../components/generatif/Pli.astro';
import { LIBELLES_DISCIPLINES, projetSuivant, projetsTries } from '../../lib/contenu';

export const getStaticPaths = (async () => {
  const projets = await projetsTries();
  return projets.map((projet) => ({
    params: { slug: projet.id },
    props: { projet, suivant: projetSuivant(projets, projet.id) },
  }));
}) satisfies GetStaticPaths;

const { projet, suivant } = Astro.props;
const { title, client, year, disciplines, summary, seed, palette } = projet.data;
const { Content } = await render(projet);
---

<BaseLayout title={title} description={summary}>
  <article class="etude">
    <header class="conteneur etude__entete">
      <p class="etude__retour"><a href="/projets/">← Tous les projets</a></p>
      <h1>{title}</h1>
      <p class="chapo">{summary}</p>
      <dl class="etude__infos">
        <div><dt>Client</dt><dd>{client}</dd></div>
        <div><dt>Année</dt><dd>{year}</dd></div>
        <div><dt>Disciplines</dt><dd>{disciplines.map((d) => LIBELLES_DISCIPLINES[d]).join(', ')}</dd></div>
      </dl>
    </header>

    <div class="etude__visuel" transition:name={`visuel-${projet.id}`}>
      <Pli seed={seed} palette={palette} format="hero" />
    </div>

    <div class="conteneur etude__corps">
      <div class="prose">
        <Content />
      </div>
    </div>
  </article>

  <nav class="conteneur suivant" aria-label="Projet suivant">
    <a href={`/projets/${suivant.id}/`} class="suivant__lien">
      <span class="suivant__label">Projet suivant</span>
      <span class="suivant__titre">{suivant.data.title} →</span>
    </a>
  </nav>
</BaseLayout>

<style>
  .etude__entete {
    display: grid;
    gap: var(--space-m);
    padding-block: var(--space-l);
  }

  .etude__entete h1 {
    font-size: var(--fs-hero);
  }

  .etude__retour a {
    color: var(--color-text-muted);
    text-decoration: none;
  }

  .etude__infos {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-m) var(--space-l);
    margin: 0;
  }

  .etude__infos dt {
    color: var(--color-text-muted);
    font-size: var(--fs-small);
  }

  .etude__infos dd {
    margin: 0;
  }

  .etude__visuel {
    height: clamp(16rem, 45vw, 36rem);
    overflow: hidden;
  }

  .etude__corps {
    padding-block: var(--space-xl) 0;
  }

  @media (min-width: 64rem) {
    .etude__corps .prose {
      margin-left: 33%;
    }
  }

  .suivant {
    margin-top: var(--space-xl);
    padding-top: var(--space-l);
    border-top: 1px solid var(--color-line);
  }

  .suivant__lien {
    display: grid;
    gap: var(--space-xs);
    color: var(--color-text);
    text-decoration: none;
  }

  .suivant__label {
    color: var(--color-text-muted);
    font-size: var(--fs-small);
  }

  .suivant__titre {
    font-family: var(--font-display);
    font-size: var(--fs-h2);
    line-height: 1;
  }

  .suivant__lien:hover .suivant__titre {
    color: var(--color-pink);
  }
</style>
```

- [ ] **Step 6 : Consigner la décision dans `docs/DECISIONS.md`**

```markdown
## 2026-09-25 — Filtre des projets appliqué sur le HTML statique

- **Décision** : l'îlot `FiltreProjets.vue` masque/affiche les cartes rendues par Astro (attribut `data-disciplines`) au lieu de rendre lui-même la grille ; il est hydraté en `client:idle` et n'affiche ses boutons qu'une fois monté.
- **Alternatives écartées** : rendre toute la grille en Vue (impossible de réutiliser les SVG générés au build par `Pli.astro`) ; `client:visible` (un îlot vide avant montage n'a pas de surface à observer).
- **Raison** : visuels 100 % statiques, et page complète sans JavaScript.
```

- [ ] **Step 7 : Vérifier**

Run : `npm run build`
Attendu : `Complete!` et 7 pages projets. Puis :
Run : `ls dist/projets; grep -c 'data-disciplines' dist/projets/index.html; grep -o 'view-transition-name: *visuel-kori' dist/projets/index.html dist/projets/kori/index.html | head -2`
Attendu : `index.html` + 6 dossiers de projets ; `6` ; si la seconde commande ne renvoie rien, vérifier plutôt `grep -o 'data-astro-transition-scope="[^"]*"' dist/projets/kori/index.html` (Astro peut porter le nom de transition par un attribut de portée).

Contrôle navigateur : cliquer « Identité » n'affiche que Atelier Sillon, Opus Cinq et Kōri ; recliquer revient à « Tous » ; depuis la liste, ouvrir Kōri : la vignette se transforme en visuel hero.

- [ ] **Step 8 : Commit**

```bash
git add src/components/CarteProjet.astro src/components/islands/FiltreProjets.vue src/pages/projets docs/DECISIONS.md
git commit -m "feat: ajoute la liste filtrable et les études de cas"
```

---

### Task 7 : Page Studio

Branche : `feature/studio` (parallélisable avec 6 et 8)

**Files :**
- Create : `src/components/ListeServices.astro`, `src/components/Methode.astro`, `src/components/CarteMembre.astro`, `src/components/Appel.astro`, `src/pages/studio.astro`

**Interfaces :**
- Consumes : `Pli.astro` (T2), `BaseLayout` (T3), `servicesTries`, `equipeTriee`, `PALETTE_EQUIPE` (T4).
- Produces :
  - `ListeServices.astro` props `{ services: CollectionEntry<'services'>[]; compact?: boolean }` (`compact` = titres seuls, pour l'accueil).
  - `Appel.astro` props `{ titre: string; texte: string; href: string; libelle: string }`.
  - `CarteMembre.astro` props `{ membre: CollectionEntry<'equipe'> }`.
  - `Methode.astro` sans props.

- [ ] **Step 1 : Créer la branche**

```bash
git switch develop && git switch -c feature/studio
```

- [ ] **Step 2 : Écrire `src/components/ListeServices.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';

interface Props {
  services: CollectionEntry<'services'>[];
  /** Titres seuls (aperçu de la page d'accueil). */
  compact?: boolean;
}

const { services, compact = false } = Astro.props;
---

<ol class:list={['services', { 'services--compact': compact }]} role="list">
  {
    services.map((service, i) => (
      <li class="service revele">
        <span class="service__numero" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
        <h3 class="service__titre">{service.data.title}</h3>
        {!compact && (
          <>
            <p class="service__description">{service.data.description}</p>
            <ul class="service__livrables" aria-label={`Livrables : ${service.data.title}`}>
              {service.data.deliverables.map((l) => <li>{l}</li>)}
            </ul>
          </>
        )}
      </li>
    ))
  }
</ol>

<style>
  .services {
    list-style: none;
    border-top: 1px solid var(--color-line);
  }

  .service {
    display: grid;
    gap: var(--space-xs) var(--space-m);
    padding-block: var(--space-m);
    border-bottom: 1px solid var(--color-line);
  }

  @media (min-width: 48rem) {
    .service {
      grid-template-columns: 4rem 1fr 1fr;
      align-items: baseline;
    }

    .service__livrables {
      grid-column: 3;
    }
  }

  .service__numero {
    color: var(--color-pink);
    font-family: var(--font-display);
  }

  .service__titre {
    font-size: var(--fs-h3);
    line-height: 1.1;
  }

  .service__description {
    color: var(--color-text-muted);
  }

  .service__livrables {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .service__livrables li {
    padding: 0.15em 0.7em;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    font-size: var(--fs-small);
  }

  .services--compact .service {
    grid-template-columns: 4rem 1fr;
  }
</style>
```

- [ ] **Step 3 : Écrire `src/components/Methode.astro`**

```astro
---
const etapes = [
  { titre: "Déplier", texte: "On écoute, on questionne, on ouvre tout : vos objectifs, votre public, vos contraintes." },
  { titre: "Marquer les plis", texte: "On trace la stratégie et le concept : ce qui compte, ce qu'on laisse de côté." },
  { titre: "Plier", texte: "Design et développement avancent ensemble, avec vous, par étapes courtes et visibles." },
  { titre: "Faire voler", texte: "Mise en ligne, mesures, ajustements : on reste là après le lancement." },
];
---

<ol class="methode" role="list">
  {
    etapes.map((etape, i) => (
      <li class="methode__etape revele" style={`--i: ${i}`}>
        <span class="methode__numero" aria-hidden="true">{i + 1}</span>
        <h3>{etape.titre}</h3>
        <p>{etape.texte}</p>
      </li>
    ))
  }
</ol>

<style>
  .methode {
    list-style: none;
    display: grid;
    gap: var(--space-m);
  }

  @media (min-width: 48rem) {
    .methode {
      grid-template-columns: repeat(4, 1fr);
    }

    /* Escalier : chaque étape descend un peu plus, comme une feuille qu'on plie */
    .methode__etape {
      margin-top: calc(var(--i) * var(--space-m));
    }
  }

  .methode__etape {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-m);
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    background: var(--color-surface);
  }

  .methode__numero {
    color: var(--color-lime);
    font-family: var(--font-display);
    font-size: var(--fs-h2);
    line-height: 1;
  }

  .methode__etape h3 {
    font-size: var(--fs-h3);
  }

  .methode__etape p {
    color: var(--color-text-muted);
  }
</style>
```

- [ ] **Step 4 : Écrire `src/components/CarteMembre.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import Pli from './generatif/Pli.astro';
import { PALETTE_EQUIPE } from '../lib/contenu';

interface Props {
  membre: CollectionEntry<'equipe'>;
}

const { membre } = Astro.props;
const { name, role, bio, seed } = membre.data;
---

<article class="membre revele">
  <div class="membre__portrait" role="img" aria-label={`Portrait génératif de ${name}`}>
    <Pli seed={seed} palette={PALETTE_EQUIPE} format="avatar" />
  </div>
  <h3 class="membre__nom">{name}</h3>
  <p class="membre__role">{role}</p>
  <p class="membre__bio">{bio}</p>
</article>

<style>
  .membre {
    display: grid;
    gap: var(--space-xs);
  }

  .membre__portrait {
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 50% 50% 50% var(--radius);
    margin-bottom: var(--space-xs);
  }

  .membre__nom {
    font-size: var(--fs-h3);
    line-height: 1.1;
  }

  .membre__role {
    color: var(--color-pink);
    font-size: var(--fs-small);
  }

  .membre__bio {
    color: var(--color-text-muted);
  }
</style>
```

- [ ] **Step 5 : Écrire `src/components/Appel.astro`**

```astro
---
interface Props {
  titre: string;
  texte: string;
  href: string;
  libelle: string;
}

const { titre, texte, href, libelle } = Astro.props;
---

<section class="appel conteneur revele">
  <h2>{titre}</h2>
  <p class="chapo">{texte}</p>
  <a class="bouton" href={href}>{libelle} →</a>
</section>

<style>
  .appel {
    display: grid;
    justify-items: start;
    gap: var(--space-m);
    margin-top: var(--space-xl);
    padding: var(--space-l) var(--space-m);
    border: 1px solid var(--color-violet);
    border-radius: var(--radius);
    background: linear-gradient(135deg, rgb(123 92 255 / 0.18), transparent 60%), var(--color-surface);
  }

  .appel h2 {
    font-size: var(--fs-h2);
  }
</style>
```

- [ ] **Step 6 : Écrire `src/pages/studio.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ListeServices from '../components/ListeServices.astro';
import Methode from '../components/Methode.astro';
import CarteMembre from '../components/CarteMembre.astro';
import Appel from '../components/Appel.astro';
import { equipeTriee, servicesTries } from '../lib/contenu';

const services = await servicesTries();
const equipe = await equipeTriee();
---

<BaseLayout
  title="Studio"
  description="Origami Digital est un studio web expérimental à Lyon : quatre personnes, quatre métiers, une obsession pour le pli."
>
  <section class="conteneur manifeste">
    <h1>Un studio qui <span class="exergue">plie</span> les règles</h1>
    <div class="manifeste__texte">
      <p class="chapo">
        Une feuille blanche ne dit rien. Pliée, elle devient une grue, un avion, une idée qui tient debout. Nous
        faisons la même chose avec le web.
      </p>
      <p>
        Origami Digital est un petit studio lyonnais. Nous concevons des sites, des identités et des interfaces
        qui ne ressemblent qu'à celles et ceux qui nous les confient. Chaque pli est pensé : s'il ne sert à rien,
        on ne le fait pas.
      </p>
    </div>
  </section>

  <section class="conteneur bloc" aria-labelledby="titre-services">
    <h2 id="titre-services">Ce qu'on plie</h2>
    <ListeServices services={services} />
  </section>

  <section class="conteneur bloc" aria-labelledby="titre-methode">
    <h2 id="titre-methode">Comment on plie</h2>
    <Methode />
  </section>

  <section class="conteneur bloc" aria-labelledby="titre-equipe">
    <h2 id="titre-equipe">Qui plie</h2>
    <div class="equipe">
      {equipe.map((membre) => <CarteMembre membre={membre} />)}
    </div>
  </section>

  <Appel
    titre="Une idée à déplier ?"
    texte="Racontez-nous votre projet : on vous répond sous 48 heures avec nos premières questions."
    href="/contact/"
    libelle="Parlons-en"
  />
</BaseLayout>

<style>
  .manifeste {
    display: grid;
    gap: var(--space-l);
    padding-block: var(--space-l) var(--space-xl);
  }

  .manifeste h1 {
    font-size: var(--fs-hero);
  }

  .manifeste__texte {
    display: grid;
    gap: var(--space-m);
    max-width: var(--measure);
  }

  @media (min-width: 64rem) {
    .manifeste__texte {
      margin-left: auto;
    }
  }

  .bloc {
    display: grid;
    gap: var(--space-l);
    margin-top: var(--space-xl);
  }

  .bloc > h2 {
    font-size: var(--fs-h2);
  }

  .equipe {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: var(--space-l) var(--space-m);
  }
</style>
```

- [ ] **Step 7 : Vérifier**

Run : `npm run build`
Attendu : `Complete!`. Puis :
Run : `grep -c 'class="service ' dist/studio/index.html; grep -c 'Portrait génératif de' dist/studio/index.html; grep -c '<h1' dist/studio/index.html`
Attendu : `4`, `4`, `1`.

- [ ] **Step 8 : Commit**

```bash
git add src/components/ListeServices.astro src/components/Methode.astro src/components/CarteMembre.astro src/components/Appel.astro src/pages/studio.astro
git commit -m "feat: ajoute la page Studio"
```

---

### Task 8 : Contact (Netlify Forms)

Branche : `feature/contact` (parallélisable avec 6 et 7)

**Files :**
- Create : `src/components/islands/FormulaireContact.vue`, `src/pages/contact/index.astro`, `src/pages/contact/merci.astro`
- Modify : `docs/DECISIONS.md`

**Interfaces :**
- Consumes : `BaseLayout` (T3, prop `noindex`).
- Produces : formulaire Netlify nommé `contact`, champs `nom`, `email`, `type`, `message`, piège `bot-field`, action sans JavaScript `/contact/merci/`.

- [ ] **Step 1 : Créer la branche**

```bash
git switch develop && git switch -c feature/contact
```

- [ ] **Step 2 : Écrire `src/components/islands/FormulaireContact.vue`**

```vue
<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue';

type Champ = 'nom' | 'email' | 'message';
type Etat = 'repos' | 'envoi' | 'succes' | 'erreur';

const TYPES = [
  { valeur: 'site', libelle: 'Un site ou une boutique' },
  { valeur: 'identite', libelle: 'Une identité visuelle' },
  { valeur: 'interface', libelle: 'Une interface ou une appli' },
  { valeur: 'experience', libelle: 'Une expérience interactive' },
  { valeur: 'autre', libelle: 'Autre chose' },
];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const valeurs = reactive({ nom: '', email: '', type: 'site', message: '', 'bot-field': '' });
const erreurs = reactive<Record<Champ, string>>({ nom: '', email: '', message: '' });
const etat = ref<Etat>('repos');
const formulaire = ref<HTMLFormElement | null>(null);
const confirmation = ref<HTMLElement | null>(null);

function valider(): boolean {
  const email = valeurs.email.trim();
  erreurs.nom = valeurs.nom.trim() ? '' : 'Indiquez votre nom.';
  erreurs.email = !email ? 'Indiquez votre e-mail.' : EMAIL.test(email) ? '' : 'Cet e-mail ne semble pas valide (exemple : nom@domaine.fr).';
  erreurs.message =
    valeurs.message.trim().length >= 10 ? '' : 'Décrivez votre projet en quelques mots (10 caractères minimum).';
  return !erreurs.nom && !erreurs.email && !erreurs.message;
}

async function envoyer(evenement: Event) {
  evenement.preventDefault();
  if (etat.value === 'envoi') return;
  if (!valider()) {
    await nextTick();
    formulaire.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    return;
  }
  etat.value = 'envoi';
  try {
    const corps = new URLSearchParams({ 'form-name': 'contact', ...valeurs });
    const reponse = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: corps.toString(),
    });
    if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
    etat.value = 'succes';
    await nextTick();
    confirmation.value?.focus();
  } catch {
    etat.value = 'erreur';
  }
}
</script>

<template>
  <div v-if="etat === 'succes'" ref="confirmation" class="confirmation" role="status" tabindex="-1">
    <p class="confirmation__titre">Message bien reçu.</p>
    <p>On le déplie avec attention et on vous répond sous 48 heures.</p>
  </div>
  <form
    v-else
    ref="formulaire"
    name="contact"
    method="POST"
    action="/contact/merci/"
    data-netlify="true"
    netlify-honeypot="bot-field"
    novalidate
    class="formulaire"
    @submit="envoyer"
  >
    <input type="hidden" name="form-name" value="contact" />
    <p class="piege" aria-hidden="true">
      <label>Ne remplissez pas ce champ : <input v-model="valeurs['bot-field']" name="bot-field" tabindex="-1" autocomplete="off" /></label>
    </p>

    <div class="champ">
      <label for="contact-nom">Nom</label>
      <input
        id="contact-nom"
        v-model="valeurs.nom"
        name="nom"
        type="text"
        autocomplete="name"
        required
        :aria-invalid="erreurs.nom ? 'true' : undefined"
        :aria-describedby="erreurs.nom ? 'contact-nom-erreur' : undefined"
      />
      <p v-if="erreurs.nom" id="contact-nom-erreur" class="champ__erreur">{{ erreurs.nom }}</p>
    </div>

    <div class="champ">
      <label for="contact-email">E-mail</label>
      <input
        id="contact-email"
        v-model="valeurs.email"
        name="email"
        type="email"
        autocomplete="email"
        required
        :aria-invalid="erreurs.email ? 'true' : undefined"
        :aria-describedby="erreurs.email ? 'contact-email-erreur' : undefined"
      />
      <p v-if="erreurs.email" id="contact-email-erreur" class="champ__erreur">{{ erreurs.email }}</p>
    </div>

    <div class="champ">
      <label for="contact-type">Votre projet</label>
      <select id="contact-type" v-model="valeurs.type" name="type">
        <option v-for="t in TYPES" :key="t.valeur" :value="t.valeur">{{ t.libelle }}</option>
      </select>
    </div>

    <div class="champ">
      <label for="contact-message">Message</label>
      <textarea
        id="contact-message"
        v-model="valeurs.message"
        name="message"
        rows="6"
        required
        minlength="10"
        :aria-invalid="erreurs.message ? 'true' : undefined"
        :aria-describedby="erreurs.message ? 'contact-message-erreur' : undefined"
      ></textarea>
      <p v-if="erreurs.message" id="contact-message-erreur" class="champ__erreur">{{ erreurs.message }}</p>
    </div>

    <p v-if="etat === 'erreur'" class="formulaire__alerte" role="alert">
      L'envoi a échoué. Réessayez dans un instant, ou écrivez-nous à bonjour@origami-digital.example.
    </p>

    <button type="submit" class="bouton" :disabled="etat === 'envoi'">
      {{ etat === 'envoi' ? 'Envoi…' : 'Envoyer' }}
    </button>
  </form>
</template>

<style scoped>
.formulaire {
  display: grid;
  gap: var(--space-m);
  max-width: var(--measure);
}

.piege {
  position: absolute;
  left: -9999px;
}

.champ {
  display: grid;
  gap: var(--space-xs);
}

.champ label {
  font-weight: 500;
}

.champ input,
.champ select,
.champ textarea {
  width: 100%;
  padding: 0.8em 1em;
  border: 1px solid var(--color-line);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

.champ input:focus-visible,
.champ select:focus-visible,
.champ textarea:focus-visible {
  border-color: var(--color-lime);
}

.champ [aria-invalid='true'] {
  border-color: var(--color-pink);
}

.champ__erreur,
.formulaire__alerte {
  color: var(--color-pink);
  font-size: var(--fs-small);
}

.bouton {
  justify-self: start;
  border: 0;
  font: inherit;
  cursor: pointer;
}

.bouton:disabled {
  opacity: 0.6;
  cursor: wait;
}

.confirmation {
  display: grid;
  gap: var(--space-xs);
  padding: var(--space-l);
  border: 1px solid var(--color-lime);
  border-radius: var(--radius);
}

.confirmation__titre {
  font-family: var(--font-display);
  font-size: var(--fs-h3);
}
</style>
```

- [ ] **Step 3 : Écrire `src/pages/contact/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import FormulaireContact from '../../components/islands/FormulaireContact.vue';
---

<BaseLayout
  title="Contact"
  description="Un projet de site, d'identité ou d'interface ? Écrivez à Origami Digital, réponse sous 48 heures."
>
  <section class="conteneur contact">
    <div class="contact__intro">
      <h1>Parlons <span class="exergue">pli</span></h1>
      <p class="chapo">Racontez-nous votre projet, même s'il tient en trois lignes. On vous répond sous 48 heures.</p>
      <dl class="contact__coordonnees">
        <div><dt>E-mail</dt><dd><a href="mailto:bonjour@origami-digital.example">bonjour@origami-digital.example</a></dd></div>
        <div><dt>Atelier</dt><dd>12 rue des Plieurs, 69001 Lyon</dd></div>
      </dl>
    </div>
    <FormulaireContact client:visible />
  </section>
</BaseLayout>

<style>
  .contact {
    display: grid;
    gap: var(--space-l);
    padding-block: var(--space-l);
  }

  @media (min-width: 64rem) {
    .contact {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
  }

  .contact__intro {
    display: grid;
    gap: var(--space-m);
  }

  .contact__intro h1 {
    font-size: var(--fs-hero);
  }

  .contact__coordonnees {
    display: grid;
    gap: var(--space-s);
    margin: 0;
  }

  .contact__coordonnees dt {
    color: var(--color-text-muted);
    font-size: var(--fs-small);
  }

  .contact__coordonnees dd {
    margin: 0;
  }
</style>
```

- [ ] **Step 4 : Écrire `src/pages/contact/merci.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
---

<BaseLayout title="Merci" description="Votre message a bien été envoyé à Origami Digital." noindex>
  <section class="conteneur merci">
    <h1>Message <span class="exergue">bien reçu.</span></h1>
    <p class="chapo">On le déplie avec attention et on vous répond sous 48 heures.</p>
    <p><a class="bouton" href="/projets/">Voir nos projets en attendant →</a></p>
  </section>
</BaseLayout>

<style>
  .merci {
    display: grid;
    gap: var(--space-m);
    justify-items: start;
    padding-block: var(--space-xl);
  }

  .merci h1 {
    font-size: var(--fs-h1);
  }
</style>
```

- [ ] **Step 5 : Consigner la décision dans `docs/DECISIONS.md`**

```markdown
## 2026-09-25 — Formulaire de contact avec Netlify Forms

- **Décision** : formulaire HTML rendu au build (îlot Vue `FormulaireContact`), détecté par Netlify grâce à `data-netlify="true"`, protégé par un champ piège ; envoi en `fetch` quand JavaScript est disponible, envoi classique vers `/contact/merci/` sinon. Adresse de contact fictive en `.example` (domaine réservé, aucun courriel égaré).
- **Alternatives écartées** : service tiers (Formspree), fonction serverless.
- **Raison** : aucun backend ni dépendance ; reste une JAMstack pure. Limite : l'envoi ne fonctionne que sur un déploiement Netlify, pas en `npm run dev`.
```

- [ ] **Step 6 : Vérifier**

Run : `npm run build`
Attendu : `Complete!`. Puis :
Run : `grep -o 'name="contact"[^>]*' dist/contact/index.html | head -1; grep -c 'name="form-name"' dist/contact/index.html; grep -c 'noindex' dist/contact/merci/index.html; grep -c 'contact/merci' dist/sitemap-0.xml`
Attendu : la balise contient `data-netlify="true"` et `action="/contact/merci/"` ; `1` ; `1` ; `0`.

Contrôle navigateur (`npm run dev`) : envoyer le formulaire vide → trois messages d'erreur, focus sur « Nom » ; e-mail `abc` → message de format ; formulaire valide → état « Envoi… » puis message d'erreur (attendu en local : pas de Netlify).

- [ ] **Step 7 : Commit**

```bash
git add src/components/islands/FormulaireContact.vue src/pages/contact docs/DECISIONS.md
git commit -m "feat: ajoute la page Contact avec Netlify Forms"
```

---

### Task 9 : Accueil et feuille hero

Branche : `feature/accueil` (après fusion de 6 et 7 ; parallélisable avec 10)

**Files :**
- Create : `src/components/generatif/grue.ts`, `src/components/islands/FeuilleHero.vue`
- Modify : `src/pages/index.astro` (remplacement complet), `docs/DECISIONS.md`

**Interfaces :**
- Consumes : `genererPli`, `FORMATS`, `Point` (T2) ; `CarteProjet` (T6) ; `ListeServices`, `Appel` (T7) ; `projetsTries`, `servicesTries` (T4).
- Produces : `GRUE: Array<[Point, Point, Point]>` (coordonnées en % d'une scène carrée) ; `FeuilleHero.vue` props `{ seed: number; palette: string[] }`, à placer dans un élément ancêtre portant `data-hero` (sert au calcul de la progression de scroll).

- [ ] **Step 1 : Créer la branche**

```bash
git switch develop && git switch -c feature/accueil
```

- [ ] **Step 2 : Écrire `src/components/generatif/grue.ts`**

```ts
import type { Point } from './pli';

// Grue origami de profil (tournée vers la droite), en % d'une scène carrée.
// Les facettes de la feuille se replient vers ces triangles (facette i → GRUE[i % GRUE.length]).
export const GRUE: Array<[Point, Point, Point]> = [
  [[30, 62], [50, 54], [50, 76]], // corps gauche
  [[50, 54], [70, 62], [50, 76]], // corps droit
  [[50, 54], [24, 10], [46, 48]], // aile avant
  [[46, 48], [24, 10], [36, 36]], // aile avant, face intérieure
  [[52, 54], [66, 12], [58, 50]], // aile arrière
  [[58, 50], [66, 12], [62, 34]], // aile arrière, face intérieure
  [[66, 60], [86, 26], [71, 58]], // cou
  [[86, 26], [96, 32], [84, 31]], // tête
  [[34, 61], [10, 30], [30, 57]], // queue
  [[30, 57], [10, 30], [24, 48]], // queue, face intérieure
  [[38, 68], [50, 76], [62, 68]], // ventre
  [[50, 54], [58, 58], [50, 66]], // reflet central
];
```

- [ ] **Step 3 : Écrire `src/components/islands/FeuilleHero.vue`**

Chaque facette est un calque plein cadre découpé par `clip-path` : cela permet une vraie rotation 3D CSS autour de son centre (les éléments SVG ne gèrent pas `rotate3d` de façon fiable). Le rendu serveur (progression 0, sans pointeur) donne la feuille statique : c'est aussi l'état avant hydratation et sous mouvement réduit.

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { FORMATS, genererPli, type Point } from '../generatif/pli';
import { GRUE } from '../generatif/grue';

const props = defineProps<{ seed: number; palette: string[] }>();

const format = FORMATS.feuille;
const RAYON = 35; // rayon d'influence du pointeur, en % de la scène
const ANGLE_MAX = 55; // degrés

const enPourcent = ([x, y]: Point): Point => [(x / format.largeur) * 100, (y / format.hauteur) * 100];
const facettes = genererPli(props.seed, props.palette, format).facettes.map((f) => ({
  points: f.points.map(enPourcent),
  couleur: f.couleur,
}));

const racine = ref<HTMLElement | null>(null);
const pointeur = ref<Point | null>(null);
const progression = ref(0); // 0 = feuille, 1 = grue

const lisser = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const interpoler = (a: number, b: number, t: number) => a + (b - a) * t;

const styles = computed(() => {
  const p = lisser(progression.value);
  return facettes.map((facette, i) => {
    const cible = GRUE[i % GRUE.length];
    const pts = facette.points.map((pt, k): Point => [
      interpoler(pt[0], cible[k][0], p),
      interpoler(pt[1], cible[k][1], p),
    ]);
    const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3;
    const cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;

    let transform = 'none';
    let lumiere = 1;
    // Le pointeur n'agit que sur la feuille dépliée
    if (pointeur.value && p < 0.05) {
      const dx = pointeur.value[0] - cx;
      const dy = pointeur.value[1] - cy;
      const distance = Math.hypot(dx, dy) || 1;
      const influence = Math.max(0, 1 - distance / RAYON);
      if (influence > 0) {
        // Axe de rotation perpendiculaire à la direction du pointeur : la facette se soulève vers lui
        transform = `rotate3d(${(-dy / distance).toFixed(3)}, ${(dx / distance).toFixed(3)}, 0, ${(influence * ANGLE_MAX).toFixed(1)}deg)`;
        lumiere = 1 + influence * 0.35;
      }
    }

    return {
      clipPath: `polygon(${pts.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(', ')})`,
      transformOrigin: `${cx.toFixed(2)}% ${cy.toFixed(2)}%`,
      transform,
      filter: lumiere === 1 ? undefined : `brightness(${lumiere.toFixed(2)})`,
      background: facette.couleur,
    };
  });
});

let cadre = 0;
let cible: Point | null = null;

function calculerProgression(): number {
  const section = racine.value?.closest<HTMLElement>('[data-hero]');
  if (!section) return 0;
  const rect = section.getBoundingClientRect();
  const course = rect.height - window.innerHeight;
  if (course <= 0) return 0;
  return Math.min(1, Math.max(0, -rect.top / course));
}

function planifier() {
  if (cadre) return;
  cadre = requestAnimationFrame(() => {
    cadre = 0;
    pointeur.value = cible;
    progression.value = calculerProgression();
  });
}

function surPointeur(e: PointerEvent) {
  const rect = racine.value?.getBoundingClientRect();
  if (!rect) return;
  cible = [((e.clientX - rect.left) / rect.width) * 100, ((e.clientY - rect.top) / rect.height) * 100];
  planifier();
}

function surSortie() {
  cible = null;
  planifier();
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const el = racine.value;
  if (!el) return;
  el.addEventListener('pointermove', surPointeur);
  el.addEventListener('pointerdown', surPointeur);
  el.addEventListener('pointerleave', surSortie);
  window.addEventListener('scroll', planifier, { passive: true });
  window.addEventListener('resize', planifier, { passive: true });
  planifier();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(cadre);
  const el = racine.value;
  el?.removeEventListener('pointermove', surPointeur);
  el?.removeEventListener('pointerdown', surPointeur);
  el?.removeEventListener('pointerleave', surSortie);
  window.removeEventListener('scroll', planifier);
  window.removeEventListener('resize', planifier);
});
</script>

<template>
  <div ref="racine" class="feuille" aria-hidden="true">
    <div v-for="(style, i) in styles" :key="i" class="feuille__facette" :style="style"></div>
  </div>
</template>

<style scoped>
.feuille {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  perspective: 900px;
  touch-action: pan-y;
}

.feuille__facette {
  position: absolute;
  inset: 0;
  transition:
    transform 0.35s var(--ease-pli),
    filter 0.35s var(--ease-pli);
  will-change: transform, clip-path;
}

@media (prefers-reduced-motion: reduce) {
  .feuille__facette {
    transition: none;
  }
}
</style>
```

- [ ] **Step 4 : Remplacer `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import FeuilleHero from '../components/islands/FeuilleHero.vue';
import CarteProjet from '../components/CarteProjet.astro';
import ListeServices from '../components/ListeServices.astro';
import Appel from '../components/Appel.astro';
import { projetsTries, servicesTries } from '../lib/contenu';

const projets = (await projetsTries()).filter((p) => p.data.featured).slice(0, 3);
const services = await servicesTries();
---

<BaseLayout
  title="Origami Digital"
  description="Studio web expérimental : sites, identités et interfaces qui se déplient au fil du regard."
>
  <section class="hero" data-hero>
    <div class="hero__scene conteneur">
      <div class="hero__texte">
        <h1>On plie le web <span class="exergue">à vos idées.</span></h1>
        <p class="chapo">Studio expérimental. Sites, identités et interfaces qui se déplient au fil du regard.</p>
        <p><a class="bouton" href="/projets/">Voir les projets →</a></p>
      </div>
      <div class="hero__feuille">
        <FeuilleHero client:visible seed={2026} palette={['#7B5CFF', '#FF5FA2', '#35E0FF', '#1C1A2E']} />
      </div>
    </div>
  </section>

  <section class="conteneur manifeste revele" aria-label="Manifeste">
    <p>
      Une feuille blanche ne dit rien. <span class="exergue">Pliée</span>, elle devient une grue, un avion, une idée
      qui tient debout. C'est ce qu'on fait avec le web.
    </p>
  </section>

  <section class="conteneur bloc" aria-labelledby="titre-une">
    <div class="bloc__entete">
      <h2 id="titre-une">À la une</h2>
      <a href="/projets/">Tous les projets →</a>
    </div>
    <ul class="une" role="list">
      {projets.map((projet) => <li class="revele"><CarteProjet projet={projet} /></li>)}
    </ul>
  </section>

  <section class="conteneur bloc" aria-labelledby="titre-studio">
    <div class="bloc__entete">
      <h2 id="titre-studio">Le studio</h2>
      <a href="/studio/">Découvrir le studio →</a>
    </div>
    <ListeServices services={services} compact />
  </section>

  <Appel
    titre="Une idée à déplier ?"
    texte="Racontez-nous votre projet : on vous répond sous 48 heures avec nos premières questions."
    href="/contact/"
    libelle="Parlons-en"
  />
</BaseLayout>

<style>
  /* La section fait deux écrans : la scène reste collée pendant que la feuille se replie en grue */
  .hero {
    height: 200svh;
  }

  .hero__scene {
    position: sticky;
    top: 0;
    display: grid;
    align-items: center;
    min-height: 100svh;
    gap: var(--space-l);
  }

  @media (min-width: 64rem) {
    .hero__scene {
      grid-template-columns: 3fr 2fr;
    }
  }

  .hero__texte {
    position: relative;
    z-index: 1;
    display: grid;
    gap: var(--space-m);
  }

  .hero__texte h1 {
    font-size: var(--fs-hero);
  }

  .hero__feuille {
    width: min(100%, 36rem);
    justify-self: center;
  }

  @media (max-width: 63.99rem) {
    .hero__feuille {
      grid-row: 1;
      width: min(80%, 24rem);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero {
      height: auto;
    }

    .hero__scene {
      position: static;
    }
  }

  .manifeste p {
    max-width: 22ch;
    font-family: var(--font-display);
    font-size: var(--fs-h2);
    line-height: 1.05;
  }

  .bloc {
    display: grid;
    gap: var(--space-l);
    margin-top: var(--space-xl);
  }

  .bloc__entete {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-s);
  }

  .bloc__entete h2 {
    font-size: var(--fs-h2);
  }

  .une {
    list-style: none;
    display: grid;
    gap: var(--space-l) var(--space-m);
  }

  @media (min-width: 48rem) {
    .une {
      grid-template-columns: repeat(3, 1fr);
    }

    .une > li:nth-child(2) {
      margin-top: var(--space-l);
    }

    .une > li:nth-child(3) {
      margin-top: calc(2 * var(--space-l));
    }
  }

  .manifeste {
    margin-top: var(--space-xl);
  }
</style>
```

- [ ] **Step 5 : Consigner la décision dans `docs/DECISIONS.md`**

```markdown
## 2026-09-25 — Feuille hero en calques CSS 3D

- **Décision** : `FeuilleHero.vue` rend chaque facette comme un calque découpé par `clip-path` et animé par `rotate3d`, à partir de la même géométrie que `Pli.astro` (`pli.ts`). Le repli en grue suit le scroll (section de deux écrans, scène collante). Le rendu serveur de l'îlot sert d'état statique (avant hydratation et sous mouvement réduit), au lieu d'un SVG `Pli.astro` séparé.
- **Alternatives écartées** : facettes en SVG (pas de vraie rotation 3D) ; WebGL.
- **Raison** : effet 3D réel sans dépendance, un seul rendu à maintenir.
```

- [ ] **Step 6 : Vérifier**

Run : `npm run build`
Attendu : `Complete!`. Puis :
Run : `grep -o 'class="feuille__facette"' dist/index.html | wc -l; grep -c 'data-hero' dist/index.html; grep -o 'href="/projets/[a-z-]*/"' dist/index.html | sort -u`
Attendu : `32` facettes rendues au build ; `1` ; les liens vers `maree-haute`, `atelier-sillon`, `relais`.

Contrôle navigateur : au survol, les facettes proches se soulèvent et s'éclairent ; au scroll, la feuille se replie en grue puis la page continue ; avec « Émuler prefers-reduced-motion: reduce » dans les outils de développement, la feuille reste immobile et la section hero fait un seul écran.

- [ ] **Step 7 : Commit**

```bash
git add src/components/generatif/grue.ts src/components/islands/FeuilleHero.vue src/pages/index.astro docs/DECISIONS.md
git commit -m "feat: ajoute l'accueil et la feuille hero interactive"
```

---

### Task 10 : Page 404

Branche : `feature/404` (parallélisable avec 9)

**Files :**
- Create : `src/pages/404.astro`

**Interfaces :**
- Consumes : `BaseLayout` (T3), `Pli.astro` (T2).

- [ ] **Step 1 : Créer la branche**

```bash
git switch develop && git switch -c feature/404
```

- [ ] **Step 2 : Écrire `src/pages/404.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Pli from '../components/generatif/Pli.astro';
---

<BaseLayout title="Page introuvable" description="Cette page s'est froissée. Retour à l'accueil d'Origami Digital." noindex>
  <section class="conteneur perdu">
    <div class="perdu__boule">
      <Pli seed={404} palette={['#7B5CFF', '#FF5FA2', '#2A2840']} format="feuille" />
    </div>
    <div class="perdu__texte">
      <p class="perdu__code" aria-hidden="true">404</p>
      <h1>Cette page s'est <span class="exergue">froissée.</span></h1>
      <p class="chapo">Le lien est peut-être ancien, ou la page a été repliée ailleurs.</p>
      <p><a class="bouton" href="/">Retour à l'accueil →</a></p>
    </div>
  </section>
</BaseLayout>

<style>
  .perdu {
    display: grid;
    gap: var(--space-l);
    align-items: center;
    padding-block: var(--space-xl);
  }

  @media (min-width: 48rem) {
    .perdu {
      grid-template-columns: 1fr 1.4fr;
    }
  }

  /* Une feuille froissée : découpée en polygone irrégulier et tordue */
  .perdu__boule {
    width: min(70%, 22rem);
    aspect-ratio: 1;
    justify-self: center;
    clip-path: polygon(18% 4%, 62% 0, 96% 22%, 100% 64%, 78% 96%, 34% 100%, 4% 78%, 0 30%);
    transform: rotate(-14deg) skew(6deg, -4deg);
  }

  .perdu__texte {
    display: grid;
    gap: var(--space-m);
    justify-items: start;
  }

  .perdu__code {
    color: var(--color-lime);
    font-family: var(--font-display);
    font-size: var(--fs-h2);
    line-height: 1;
  }

  .perdu__texte h1 {
    font-size: var(--fs-h1);
  }
</style>
```

- [ ] **Step 3 : Vérifier**

Run : `npm run build && ls dist/404.html && grep -c 'noindex' dist/404.html && grep -c '404' dist/sitemap-0.xml`
Attendu : `dist/404.html` existe, `1`, `0` (Netlify sert automatiquement `404.html` pour les URL inconnues ; si `grep -c` renvoie 1, ajouter `&& !page.includes('/404')` au `filter` du sitemap dans `astro.config.mjs`).

- [ ] **Step 4 : Commit**

```bash
git add src/pages/404.astro
git commit -m "feat: ajoute la page 404 froissée"
```

---

### Task 11 : Vérification finale, passe design et documentation (orchestrateur + utilisateur)

Branche : `feature/finitions`

**Files :**
- Modify : `CLAUDE.md` (arborescence : `src/lib/`, `src/transitions/`, `src/components/generatif/`, `src/components/islands/`), `README.md` (liste des pages), éventuels correctifs issus des contrôles.

- [ ] **Step 1 : Contrôle navigateur complet** (`npm run build && npm run preview`), sur 320 px, 375 px, 768 px et 1440 px, pour chaque page :
  - aucun défilement horizontal (Review Focus 5) ;
  - navigation entre toutes les pages par le menu desktop puis le menu mobile : transitions « pli », îlots fonctionnels après navigation, défilement jamais bloqué (Review Focus 1) ;
  - JavaScript désactivé : tout le contenu visible, pas de boutons de filtre, formulaire qui poste (Review Focus 2) ;
  - `prefers-reduced-motion: reduce` émulé : aucune transformation animée (Review Focus 3) ;
  - clavier seul : lien d'évitement, menu, filtre, formulaire (Review Focus 4).
- [ ] **Step 2 : Passe design avec la skill `impeccable`** (critique puis polish) sur l'accueil, une étude de cas et Studio, en montrant les captures à l'utilisateur ; appliquer les corrections validées.
- [ ] **Step 3 : Mettre à jour `CLAUDE.md` (§1 arborescence) et `README.md`**, signaler la modification de CLAUDE.md à l'utilisateur.
- [ ] **Step 4 : Relecture croisée de la branche, fusion dans `develop`, puis (avec accord de l'utilisateur) push de `develop`** pour obtenir l'aperçu Netlify.
- [ ] **Step 5 : Sur l'aperçu Netlify** : Lighthouse mobile ≥ 90 sur les 4 axes pour `/`, `/projets/`, `/projets/kori/`, `/studio/`, `/contact/` ; envoi réel du formulaire (avec et sans JavaScript) et vérification dans l'onglet *Forms* de Netlify.
- [ ] **Step 6 : Proposer à l'utilisateur une `release/1.0.0`** (CHANGELOG, tag `v1.0.0`, fusion vers `main` après son accord explicite).
