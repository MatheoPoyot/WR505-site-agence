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
