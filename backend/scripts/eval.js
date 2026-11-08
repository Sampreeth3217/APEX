import { loadCsvTools } from './seed-dry.js';
import { rank, baselineRank } from '../src/scoring/rank.js';
import { mapAnswers } from '../src/features/profile.js';
import { PERSONAS } from '../src/data/personas.js';

// Side-by-side comparison of the engine vs stars-only and fit-only baselines on the sample personas.
// NDCG@3 needs a hand-labelled gold set, which has not been supplied yet, so no NDCG is reported here.
const tools = loadCsvTools().map((t, i) => ({ ...t, id: String(i), version: 1 }));
for (const p of PERSONAS) {
  const { profile } = mapAnswers(p.answers);
  const names = (list) => list.map((x) => x.tool.name).join(', ') || '(none)';
  console.log(`\n${p.slug}`);
  console.log(`  engine     : ${names(rank(tools, profile).picks)}`);
  console.log(`  stars-only : ${names(baselineRank(tools, profile, 'stars'))}`);
  console.log(`  fit-only   : ${names(baselineRank(tools, profile, 'fit'))}`);
}
