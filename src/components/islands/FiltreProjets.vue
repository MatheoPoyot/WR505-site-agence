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
