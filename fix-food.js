const fs = require('fs');
let code = fs.readFileSync('src/services/food/FoodService.ts', 'utf8');
code = code.replace(/import {\nimport { OfflineCacheInstance, AnalyticsInstance } from '\.\/EnterpriseFoodServices';\n/g, 'import { OfflineCacheInstance, AnalyticsInstance } from \'./EnterpriseFoodServices\';\nimport {\n');
fs.writeFileSync('src/services/food/FoodService.ts', code);
