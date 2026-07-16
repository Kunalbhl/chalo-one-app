const fs = require('fs');
let code = fs.readFileSync('src/components/AdminControlCenter.tsx', 'utf8');

code = code.replace(/\\n/g, '\n');
code = code.replace(/\\"/g, '"');

fs.writeFileSync('src/components/AdminControlCenter.tsx', code);
