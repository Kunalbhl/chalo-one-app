const fs = require('fs');
let code = fs.readFileSync('src/services/authService.ts', 'utf8');
code = code.replace(/if \(changed\) \{/, `if (changed) { console.log("ensureUserProfileFields changed", updates);`);
fs.writeFileSync('src/services/authService.ts', code);
