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
