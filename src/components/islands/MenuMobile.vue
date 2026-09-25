<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

interface Lien {
  href: string;
  label: string;
}

const props = defineProps<{ liens: Lien[]; chemin: string }>();

const ouvert = ref(false);
const bouton = ref<HTMLButtonElement | null>(null);
const panneau = ref<HTMLElement | null>(null);

const sansBarre = (p: string) => p.replace(/\/+$/, '') || '/';
// 'page' sur la page exacte, 'true' sur une page enfant (ex. /projets/kori/ pour le lien /projets/)
const etatActif = (href: string): 'page' | 'true' | undefined => {
  const c = sansBarre(props.chemin);
  const h = sansBarre(href);
  if (c === h) return 'page';
  if (c.startsWith(h + '/')) return 'true';
  return undefined;
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

// Isole le contenu sous le panneau plein écran des lecteurs d'écran en mode navigation
function isolerFond(actif: boolean) {
  const contenu = document.getElementById('contenu');
  const pied = document.querySelector('footer');
  for (const el of [contenu, pied]) {
    if (!el) continue;
    if (actif) {
      el.setAttribute('inert', '');
    } else {
      el.removeAttribute('inert');
    }
  }
}

watch(ouvert, (estOuvert) => {
  document.documentElement.style.overflow = estOuvert ? 'hidden' : '';
  isolerFond(estOuvert);
  if (estOuvert) {
    document.addEventListener('keydown', surTouche);
    nextTick(() => focusables()[0]?.focus());
  } else {
    document.removeEventListener('keydown', surTouche);
  }
});

// Passage en affichage bureau (≥ 48rem) : la nav-bureau reprend la main, on ferme le panneau mobile
let mediaBureau: MediaQueryList | null = null;
function surChangementMedia(e: MediaQueryListEvent) {
  if (e.matches) fermer(false);
}
onMounted(() => {
  mediaBureau = window.matchMedia('(min-width: 48rem)');
  mediaBureau.addEventListener('change', surChangementMedia);
});

// Navigation par View Transitions : l'îlot est démonté, on libère toujours le défilement
onBeforeUnmount(() => {
  document.documentElement.style.overflow = '';
  isolerFond(false);
  document.removeEventListener('keydown', surTouche);
  mediaBureau?.removeEventListener('change', surChangementMedia);
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
            <a :href="lien.href" :aria-current="etatActif(lien.href)" @click="fermer(false)">
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

.menu-mobile__panneau a[aria-current='page'],
.menu-mobile__panneau a[aria-current='true'] {
  color: var(--color-pink);
}
</style>
