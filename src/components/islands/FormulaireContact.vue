<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue';

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
const monte = ref(false);

onMounted(() => {
  monte.value = true;
});

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
    :novalidate="monte"
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
