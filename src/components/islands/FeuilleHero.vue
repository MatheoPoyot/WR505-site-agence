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

// Sans cet attribut, .hero reste en hauteur auto : pas de section de deux écrans à faire défiler sans JS
function definirHeroActif(actif: boolean) {
  const section = racine.value?.closest<HTMLElement>('[data-hero]');
  if (!section) return;
  if (actif) {
    section.setAttribute('data-hero-actif', '');
  } else {
    section.removeAttribute('data-hero-actif');
  }
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const el = racine.value;
  if (!el) return;
  definirHeroActif(true);
  el.addEventListener('pointermove', surPointeur);
  el.addEventListener('pointerdown', surPointeur);
  el.addEventListener('pointerleave', surSortie);
  window.addEventListener('scroll', planifier, { passive: true });
  window.addEventListener('resize', planifier, { passive: true });
  planifier();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(cadre);
  definirHeroActif(false);
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
}

@media (prefers-reduced-motion: reduce) {
  .feuille__facette {
    transition: none;
  }
}
</style>
