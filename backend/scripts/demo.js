import { generateDemos } from '../src/features/demo.js';

console.log(JSON.stringify(await generateDemos({ guides: !process.argv.includes('--no-guides') }), null, 2));
