const fs = require('fs');
let code = fs.readFileSync('src/services/authService.ts', 'utf8');

code = code.replace(
  /if \(changed\) \{[\s\n]*const userDocRef = doc\(db, 'users', uid\);/,
  `if (changed) {
      console.warn("Infinite loop suspect: ensureUserProfileFields changed fields:", Object.keys(updates));
      const userDocRef = doc(db, 'users', uid);`
);
fs.writeFileSync('src/services/authService.ts', code);
