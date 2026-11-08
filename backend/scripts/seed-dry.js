import fs from 'node:fs';
import Papa from 'papaparse';
import { parseRow, seedReport } from '../src/scoring/parse.js';

export function loadCsvTools() {
  const csv = fs.readFileSync(new URL('../data/ai_tools_seed.csv', import.meta.url), 'utf8');
  const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true });
  return data.map(parseRow);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const tools = loadCsvTools();
  console.log(JSON.stringify(seedReport(tools), null, 2));
}
