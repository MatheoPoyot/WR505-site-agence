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
