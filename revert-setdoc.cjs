const fs = require('fs');
function revertFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  if(!code.includes("const _patched_setDoc")) return;
  code = code.replace(/import {([^}]*)setDoc as originalSetDoc([^}]*)} from 'firebase\/firestore';\nconst setDoc = \(\.\.\.args\) => \{ console\.trace\('setDoc called!', args\[1\]\); return originalSetDoc\(\.\.\.args\); \};\nconst _patched_setDoc = true;/, "import {$1setDoc$2} from 'firebase/firestore';");
  fs.writeFileSync(file, code);
}
revertFile('src/App.tsx');
revertFile('src/services/authService.ts');
