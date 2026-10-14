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
