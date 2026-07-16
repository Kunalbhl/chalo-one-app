const fs = require('fs');
let code = fs.readFileSync('src/services/food/FoodService.ts', 'utf8');
code = code.replace("import { import { OfflineCacheInstance, AnalyticsInstance } from './EnterpriseFoodServices';\nimport {", "import { OfflineCacheInstance, AnalyticsInstance } from './EnterpriseFoodServices';\nimport {");
fs.writeFileSync('src/services/food/FoodService.ts', code);
