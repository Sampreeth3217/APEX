import { db, q, liveTools } from '../db.js';
import { rank, quadrant } from '../scoring/rank.js';
import { BETTER_TOOL_DELTA } from '../scoring/config.js';
import { priorMeans } from '../scoring/trust.js';
import { scoreTool } from '../scoring/rank.js';
import { priceText } from '../features/format.js';

// Reason built only from verified structured differences — never by the LLM.
export function betterReason(next, prev, profile) {
  const parts = [];
  const a = next.price_min_month; const b = prev.price_min_month;
  if (a !== null && a !== undefined && b !== null && b !== undefined && Number(a) < Number(b)) parts.push(`costs $${Math.round(Number(b) - Number(a))} less a month`);
  if (next.has_free_plan === true && prev.has_free_plan !== true) parts.push('has a free plan');
  const owner = (profile.existing_software || []).filter((s) => s !== 'Other');
  const newInts = owner.filter((o) => (next.integrations || []).some((i) => i.toLowerCase().includes(o.toLowerCase().split(' ')[0])) && !(prev.integrations || []).some((i) => i.toLowerCase().includes(o.toLowerCase().split(' ')[0])));
  if (newInts.length) parts.push(`works with ${newInts.join(' and ')}`);
  const body = parts.length ? parts.join(' and ') : 'matches your answers better';
  return `${next.name} ${body} than ${prev.name}.`;
}

export async function runRematch() {
  const tools = await liveTools();
  const means = priorMeans(tools);
  const saved = await q(db().from('user_tools').select('user_id,tool_id,final_at_pick,status').in('status', ['considering', 'using']));
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const stats = { checked: saved.length, created: 0, skipped_recent: 0, skipped_duplicate: 0 };
  const notifiedUsers = new Set();
  for (const ut of saved) {
    if (notifiedUsers.has(ut.user_id)) { stats.skipped_recent += 1; continue; }
    const prof = await q(db().from('profiles').select('structured').eq('user_id', ut.user_id).eq('is_current', true).maybeSingle());
    const prev = tools.find((t) => t.id === ut.tool_id);
    if (!prof || !prev || ut.final_at_pick === null) continue;
    const profile = prof.structured;
    const savedIds = new Set(saved.filter((s) => s.user_id === ut.user_id).map((s) => s.tool_id));
    const r = rank(tools.filter((t) => t.category === prev.category), { ...profile, primary_needs: [prev.category] }, { means });
    const better = r.all.find((s) => !s.reasons && !savedIds.has(s.tool.id) && ['top_pick', 'thin_evidence'].includes(quadrant(s.fit, s.trust))
      && s.final >= Number(ut.final_at_pick) + BETTER_TOOL_DELTA);
    if (!better) continue;
    const recent = await q(db().from('notifications').select('id,tool_id,replaces_tool_id').eq('user_id', ut.user_id).eq('type', 'better_tool').gte('created_at', weekAgo));
    if (recent.some((n) => n.tool_id === better.tool.id && n.replaces_tool_id === prev.id)) { stats.skipped_duplicate += 1; continue; }
    if (recent.length) { stats.skipped_recent += 1; continue; }
    const prevNow = scoreTool(prev, profile, means);
    await q(db().from('notifications').insert({
      user_id: ut.user_id, type: 'better_tool', tool_id: better.tool.id, replaces_tool_id: prev.id, channel: 'in_app',
      reason: betterReason(better.tool, prev, profile),
      scores: { new: { fit: better.fit, trust: better.trust, final: better.final, price: priceText(better.tool) }, old: { final_at_pick: Number(ut.final_at_pick), final_now: prevNow.final } },
      sent_at: new Date().toISOString(),
    }));
    // Email: only if consent granted AND a verified sender is configured (none configured). SMS: logged stub only.
    const consents = await q(db().from('consents').select('channel,granted').eq('user_id', ut.user_id));
    if (consents.some((c) => c.channel === 'sms' && c.granted)) console.log(`[sms-stub] would text user ${ut.user_id.slice(0, 8)} about a better tool`);
    notifiedUsers.add(ut.user_id);
    stats.created += 1;
  }
  return stats;
}
