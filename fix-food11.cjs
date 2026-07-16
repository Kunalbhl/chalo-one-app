const fs = require('fs');
let lines = fs.readFileSync('src/services/food/FoodService.ts', 'utf8').split('\n');
if(lines[1] === lines[2]) {
  lines.splice(1, 1);
}
fs.writeFileSync('src/services/food/FoodService.ts', lines.join('\n'));
