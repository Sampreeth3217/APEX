import { z } from 'zod';
import { OUTCOME_LIST, BUSINESS_TAGS, CATEGORY_SLUGS } from '../data/categories.js';

const nullableInt = z.number().int().min(1).max(5).nullable();
export const ToolEnrichment = z.object({
  setup_complexity: nullableInt,
  setup_time_class: z.enum(['same_day', 'few_days', 'needs_onboarding']).nullable(),
  tech_level_needed: nullableInt,
  outcomes: z.array(z.string()).nullable().transform((a) => (a || []).filter((o) => OUTCOME_LIST.includes(o)).slice(0, 6)),
  business_types: z.array(z.string()).nullable().transform((a) => (a || []).filter((o) => BUSINESS_TAGS.includes(o))),
  typical_use_cases: z.array(z.string().max(200)).nullable().transform((a) => (a || []).slice(0, 4)),
  confidence: z.number().min(0).max(1).nullable(),
});

export const ProfileOut = z.object({
  summary: z.string().min(10).max(600),
  extra_needs: z.array(z.string()).default([]).transform((a) => a.filter((n) => CATEGORY_SLUGS.includes(n))),
});

export const Explanation = z.object({
  tools: z.array(z.object({
    slug: z.string(),
    one_line: z.string().max(160),
    why_it_fits: z.string().max(600),
    not_for: z.string().max(400),
    check_first: z.string().max(400),
  })),
});

export const CommentTags = z.object({
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  topics: z.array(z.enum(['ease', 'price', 'support', 'results', 'setup', 'reliability'])).max(6),
  summary: z.string().max(140),
});

export const CompareOut = z.object({ sentences: z.array(z.string().max(300)).min(1).max(6) });
