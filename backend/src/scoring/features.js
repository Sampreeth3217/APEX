import { BUSINESS_TYPES } from '../data/categories.js';
import { DEFAULT_WEIGHTS, PRIORITY_DIM, TIME_CLASSES, URGENCY_CLASS, TIME_PENALTY } from './config.js';

const clamp01 = (x) => Math.max(0, Math.min(1, x));

export function weightsFor(priority) {
  const w = { ...DEFAULT_WEIGHTS };
  const dim = PRIORITY_DIM[priority];
  if (!dim) return w;
  const others = Object.keys(w).filter((k) => k !== dim);
  w[dim] += 0.10;
  others.forEach((k) => { w[k] -= 0.10 / others.length; });
  return w;
}

export function needScore(tool, profile) {
  const categoryMatch = profile.primary_needs.includes(tool.category) ? 1 : 0;
  const owner = profile.outcomes || [];
  const toolOut = tool.outcomes || [];
  let overlap;
  let unknown = false;
  if (!toolOut.length || !owner.length) { overlap = 0.5; unknown = !toolOut.length; }
  else overlap = owner.filter((o) => toolOut.includes(o)).length / owner.length;
  let score = 0.55 * categoryMatch + 0.45 * overlap;
  const tags = BUSINESS_TYPES[profile.business_type]?.tags || [];
  const typeMatch = tags.some((t) => (tool.business_types || []).includes(t));
  if (typeMatch) score += 0.05;
  return { score: clamp01(score), unknown, note: unknown ? 'Outcomes for this tool are not listed' : typeMatch ? 'Built with your type of business in mind' : null };
}

export function budgetScore(tool, profile) {
  if (tool.has_free_plan === true) return { score: 1, unknown: false, note: 'Has a free plan' };
  if (tool.price_min_month === null || tool.price_min_month === undefined) return { score: 0.5, unknown: true, note: 'Price not listed' };
  const ratio = Number(tool.price_min_month) / Math.max(profile.budget_month, 1);
  const score = clamp01((1.25 - ratio) / 0.65);
  return { score: ratio <= 0.6 ? 1 : score, unknown: false, note: tool.price_conflict ? 'Prices vary by source' : null };
}

export function easeScore(tool, profile) {
  if (tool.setup_complexity === null || tool.setup_complexity === undefined) return { score: 0.5, unknown: true, note: 'Setup effort not listed' };
  return { score: 1 - Math.max(0, tool.setup_complexity - profile.tech_comfort) / 4, unknown: false, note: null };
}

export function timelineScore(tool, profile) {
  const cls = tool.setup_time_class;
  if (!cls || !TIME_CLASSES.includes(cls)) return { score: 0.5, unknown: true, note: 'Setup time not listed' };
  const need = TIME_CLASSES.indexOf(URGENCY_CLASS[profile.urgency] || 'needs_onboarding');
  const slower = TIME_CLASSES.indexOf(cls) - need;
  return { score: slower <= 0 ? 1 : TIME_PENALTY[slower], unknown: false, note: slower > 0 ? 'May take longer than you want' : null };
}

const swAliases = (s) => s.split('/').map((x) => x.trim().toLowerCase()).filter(Boolean);
export function softwareMatches(owner, integration) {
  const i = integration.toLowerCase();
  return swAliases(owner).some((o) => i.includes(o) || o.includes(i) || o.split(' ')[0] === i.split(' ')[0]);
}

export function integrationScore(tool, profile) {
  const owner = (profile.existing_software || []).filter((s) => s.toLowerCase() !== 'other');
  if (!owner.length) return { score: 0.6, unknown: false, note: null, matched: [] };
  const ints = tool.integrations || [];
  if (!ints.length) return { score: 0.4, unknown: true, note: 'Connections not listed', matched: [] };
  const matched = owner.filter((o) => ints.some((i) => softwareMatches(o, i)));
  return { score: matched.length / owner.length, unknown: false, note: matched.length ? `Works with ${matched.join(', ')}` : null, matched };
}

export function fitBreakdown(tool, profile) {
  const dims = { N: needScore(tool, profile), B: budgetScore(tool, profile), A: easeScore(tool, profile), T: timelineScore(tool, profile), I: integrationScore(tool, profile) };
  const w = weightsFor(profile.priority);
  const fit = Object.keys(w).reduce((s, k) => s + w[k] * dims[k].score, 0);
  return { fit, dims, weights: w };
}
