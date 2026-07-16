const fs = require('fs');
let code = fs.readFileSync('src/services/authService.ts', 'utf8');

code = code.replace(/console\.warn\("ensureUserProfileFields changed", updates\);\n      \/\/ const userDocRef = doc\(db, 'users', uid\);\n      \/\/ await setDoc\(userDocRef, updates, \{ merge: true \}\);\n      return \{ \.\.\.data, \.\.\.updates, \.\.\.requiredFields \};/, `const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, updates, { merge: true });
      return { ...data, ...updates, ...requiredFields };`);

fs.writeFileSync('src/services/authService.ts', code);
