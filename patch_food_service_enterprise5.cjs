const fs = require('fs');
let code = fs.readFileSync('src/services/food/FoodService.ts', 'utf8');

code = "import { db, auth } from '../../firebase';\n" + code;

fs.writeFileSync('src/services/food/FoodService.ts', code);
