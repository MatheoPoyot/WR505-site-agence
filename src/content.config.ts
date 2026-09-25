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
