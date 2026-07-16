const fs = require('fs');
let code = fs.readFileSync('src/services/food/FoodService.ts', 'utf8');
code = code.replace(/const { OfflineCacheInstance } = await import\('\.\/EnterpriseFoodServices'\);/g, '');
code = code.replace(/const { AnalyticsInstance } = await import\('\.\/EnterpriseFoodServices'\);/g, '');
code = code.replace(/const { OfflineCacheInstance, AnalyticsInstance } = await import\('\.\/EnterpriseFoodServices'\);/g, '');

let lines = code.split('\n');
let i = 0;
while(lines[i].startsWith('import')) {
  i++;
}
lines.splice(i, 0, "import { OfflineCacheInstance, AnalyticsInstance } from './EnterpriseFoodServices';");
fs.writeFileSync('src/services/food/FoodService.ts', lines.join('\n'));
console.log("Patched FoodService.ts");
