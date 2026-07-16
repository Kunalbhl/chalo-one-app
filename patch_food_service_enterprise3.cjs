const fs = require('fs');
let code = fs.readFileSync('src/services/food/FoodService.ts', 'utf8');

code = code.replace(/import \{ writeBatch, runTransaction, db, auth \}/, 'import { db, auth }');
code = code.replace(/import \{/, "import { writeBatch, runTransaction, ");

fs.writeFileSync('src/services/food/FoodService.ts', code);
