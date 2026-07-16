const fs = require('fs');
let code = fs.readFileSync('src/services/authService.ts', 'utf8');

code = code.replace(
  /await setDoc\(userDocRef, \{\n\s*lastLogin: serverTimestamp\(\),\n\s*updatedAt: serverTimestamp\(\),\n\s*emailVerified: user.emailVerified\n\s*\}, \{ merge: true \}\);/g,
  `try {
        await setDoc(userDocRef, {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
          emailVerified: user.emailVerified
        }, { merge: true });
      } catch(e) {
        console.error("Quota exceeded on lastLogin update", e);
      }`
);
fs.writeFileSync('src/services/authService.ts', code);
