const fs = require('fs');
let code = fs.readFileSync('src/services/food/FoodService.ts', 'utf8');

// remove all 'import { writeBatch, runTransaction' lines entirely
const lines = code.split('\n');
const filtered = lines.filter(l => !l.includes('import { writeBatch, runTransaction'));

// Now add it correctly to the existing firestore import
let out = filtered.join('\n');
out = out.replace(/import \{ \n  collection, doc/, "import { \n  collection, doc, writeBatch, runTransaction");

fs.writeFileSync('src/services/food/FoodService.ts', out);
