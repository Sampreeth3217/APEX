import { enrichAll } from '../src/features/demo.js';

console.log(JSON.stringify(await enrichAll(), null, 2));
