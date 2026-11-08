import { z } from 'zod';
import { CATEGORY_SLUGS, BUSINESS_TYPES, BUDGET_BANDS, SOFTWARE, TEAM_SIZES, URGENCY, PRIORITIES, CATEGORY_BY_SLUG, OUTCOME_LIST } from '../data/categories.js';
import { sanitizeText } from '../security/sanitize.js';

export const AnswersSchema = z.object({
  business_type: z.enum(Object.keys(BUSINESS_TYPES)),
  team_size_band: z.enum(TEAM_SIZES),
  needs: z.array(z.enum(CATEGORY_SLUGS)).max(2),
  something_else: z.boolean().default(false),
  hours: z.record(z.string(), z.number().min(0).max(20)).default({}),
  outcomes: z.array(z.enum(OUTCOME_LIST)).max(12).default([]),
  budget: z.enum(Object.keys(BUDGET_BANDS)),
  software: z.array(z.enum(SOFTWARE)).max(10).default([]),
  tech_comfort: z.number().int().min(1).max(5),
  urgency: z.enum(URGENCY),
  priority: z.enum(PRIORITIES),
  free_text: z.string().max(1000).optional().default(''),
  hourly_value: z.number().min(0).max(1000).optional(),
}).refine((a) => a.needs.length >= 1 || a.something_else, { message: 'Choose at least one headache' })
  .refine((a) => a.needs.length + (a.something_else ? 1 : 0) <= 2, { message: 'Choose up to two headaches' });

export const ProfileSchema = z.object({
  business_type: z.string(),
  team_size_band: z.enum(TEAM_SIZES),
  primary_needs: z.array(z.enum(CATEGORY_SLUGS)).min(1).max(2),
  hours_per_week: z.record(z.string(), z.number()),
  outcomes: z.array(z.string()),
  budget_month: z.number(),
  free_only: z.boolean(),
  existing_software: z.array(z.string()),
  tech_comfort: z.number().int().min(1).max(5),
  urgency: z.enum(URGENCY),
  priority: z.enum(PRIORITIES),
  hourly_value: z.number().optional(),
  summary: z.string().optional(),
});

// Plain code mapping (no LLM), system design §4 stage 1.
export function mapAnswers(raw) {
  const a = AnswersSchema.parse(raw);
  const needs = a.needs.filter((n, i, arr) => arr.indexOf(n) === i).slice(0, 2);
  const allowedOutcomes = needs.flatMap((n) => CATEGORY_BY_SLUG[n].outcomes.map(([k]) => k));
  const hours = Object.fromEntries(needs.map((n) => [n, Number(a.hours[n] ?? 0)]));
  return {
    answers: { ...a, free_text: sanitizeText(a.free_text, 1000) },
    profile: {
      business_type: a.business_type,
      team_size_band: a.team_size_band,
      primary_needs: needs,
      hours_per_week: hours,
      outcomes: a.outcomes.filter((o) => allowedOutcomes.includes(o)),
      budget_month: BUDGET_BANDS[a.budget],
      free_only: a.budget === 'free_only',
      existing_software: a.software,
      tech_comfort: a.tech_comfort,
      urgency: a.urgency,
      priority: a.priority,
      ...(a.hourly_value ? { hourly_value: a.hourly_value } : {}),
    },
  };
}

const URGENCY_WORDS = { this_week: 'this week', this_month: 'this month', no_rush: 'when it suits' };
export function templateSummary(p) {
  const type = BUSINESS_TYPES[p.business_type]?.label.toLowerCase() || 'business';
  const size = { just_me: 'a one-person', '2-9': 'a small', '10-49': 'a growing' }[p.team_size_band];
  const needs = p.primary_needs.map((n) => CATEGORY_BY_SLUG[n].label.toLowerCase()).join(' and ');
  const budget = p.free_only ? 'free tools only' : `up to about $${p.budget_month} a month`;
  return `${size[0].toUpperCase()}${size.slice(1)} ${type} that wants help with ${needs}. Tech comfort ${p.tech_comfort} of 5, budget ${budget}, and wants it running ${URGENCY_WORDS[p.urgency]}.`;
}
