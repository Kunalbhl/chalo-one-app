const fs = require('fs');
let code = fs.readFileSync('src/services/food/FoodService.ts', 'utf8');
code = code.replace(/import { db, auth } from '\.\.\/\.\.\/firebase';\nimport {\n { OfflineCacheInstance, AnalyticsInstance } from '\.\/EnterpriseFoodServices';\n/g, 'import { db, auth } from \'../../firebase\';\nimport { OfflineCacheInstance, AnalyticsInstance } from \'./EnterpriseFoodServices\';\nimport {\n');
code = code.replace(/import { db, auth } from '\.\.\/\.\.\/firebase';\nimport { { OfflineCacheInstance, AnalyticsInstance } from '\.\/EnterpriseFoodServices';\n/g, 'import { db, auth } from \'../../firebase\';\nimport { OfflineCacheInstance, AnalyticsInstance } from \'./EnterpriseFoodServices\';\nimport {\n');
fs.writeFileSync('src/services/food/FoodService.ts', code);
