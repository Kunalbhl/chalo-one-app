const fs = require('fs');

function patchFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  if(code.includes("const _patched_setDoc")) return;
  code = code.replace(/import {([^}]*)setDoc([^}]*)} from 'firebase\/firestore';/, "import {$1setDoc as originalSetDoc$2} from 'firebase/firestore';\nconst setDoc = (...args) => { console.trace('setDoc called!', args[1]); return originalSetDoc(...args); };\nconst _patched_setDoc = true;");
  fs.writeFileSync(file, code);
}
patchFile('src/App.tsx');
patchFile('src/services/authService.ts');
