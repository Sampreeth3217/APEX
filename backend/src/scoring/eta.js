import { CATEGORY_BY_SLUG } from '../data/categories.js';

const r05 = (x) => Math.round(x * 2) / 2;

export function eta(tool, profile, fit) {
  const prior = CATEGORY_BY_SLUG[tool.category]?.eta;
  const H = Number(profile.hours_per_week?.[tool.category] ?? 0);
  if (!prior || !H) return { low: 0, likely: 0, high: 0, first_month: { low: 0, high: 0 }, payback_months: null, estimate: true, hours_input: H };
  const f = 0.7 + 0.3 * fit;
  const calc = (a, ramp) => H * a * ramp * f;
  const low = calc(prior[0], 1); const high = calc(prior[1], 1);
  const likely = (low + high) / 2;
  let payback = null;
  if (profile.hourly_value && tool.price_min_month) {
    const monthlyValue = likely * 4.33 * profile.hourly_value;
    payback = monthlyValue > 0 ? Math.round((tool.price_min_month / monthlyValue) * 10) / 10 : null;
  }
  return {
    low: r05(low), likely: r05(likely), high: r05(high),
    first_month: { low: r05(calc(prior[0], 0.5)), high: r05(calc(prior[1], 0.5)) },
    payback_months: payback, estimate: true, hours_input: H,
  };
}
