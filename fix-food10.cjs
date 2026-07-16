const fs = require('fs');
let lines = fs.readFileSync('src/services/food/FoodService.ts', 'utf8').split('\n');
lines[1] = "import { OfflineCacheInstance, AnalyticsInstance } from './EnterpriseFoodServices';";
fs.writeFileSync('src/services/food/FoodService.ts', lines.join('\n'));
