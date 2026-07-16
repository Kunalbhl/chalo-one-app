const fs = require('fs');
let lines = fs.readFileSync('src/services/food/FoodService.ts', 'utf8').split('\n');
if (lines[1].includes('import { import { OfflineCacheInstance')) {
  lines[1] = "import { OfflineCacheInstance, AnalyticsInstance } from './EnterpriseFoodServices';\nimport {";
}
fs.writeFileSync('src/services/food/FoodService.ts', lines.join('\n'));
