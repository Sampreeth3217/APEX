import { db, q } from '../src/db.js';
import { generateGuide } from '../src/llm/tasks.js';
const t = await q(db().from('tools').select('*').eq('slug', process.argv[2] || 'jobber').single());
const g = await generateGuide(t, 2, { business_type: 'plumber_hvac', existing_software: ['QuickBooks'] }, null);
console.log(g.is_fallback, g.body_md.slice(0, 900));
