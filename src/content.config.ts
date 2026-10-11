import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string().min(1),
    titleLines: z.tuple([z.string().min(1), z.string().min(1)]),
    posterCode: z.string().min(1),
    posterTitle: z.string().min(1),
    cardCaption: z.string().min(1),
    keywords: z.array(z.string().min(1)).nonempty(),
    tone: z.enum(['ice', 'warm']).default('ice'),
    subtitle: z.string().min(1),
    order: z.number().int().nonnegative(),
    engine: z.string().min(1),
    genre: z.string(),
    role: z.string().min(1),
    status: z.enum(['开发中', '原型阶段', '已完成']),
    summary: z.string().min(10),
    personalScope: z.array(z.string()).nonempty(),
    integratedSystems: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    evidenceLevel: z.enum(['described', 'captured', 'tested']).default('described'),
    mediaApproved: z.boolean().default(false),
    draft: z.boolean().default(false),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    coverCaption: z.string().optional(),
    evidenceNote: z.string().optional(),
    demoHighlights: z.array(z.string().min(1)).default([]),
    gallery: z.array(z.object({
      src: z.string().min(1),
      alt: z.string().min(1),
      caption: z.string().min(1),
    })).default([]),
    sourceUrl: z.url().optional(),
  }).refine((data) => !data.mediaApproved || Boolean(data.cover && data.coverAlt), {
    message: '已核准的媒体必须同时提供 cover 和 coverAlt。',
    path: ['cover'],
  }),
});

export const collections = { projects };
