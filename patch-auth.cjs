const fs = require('fs');
let code = fs.readFileSync('src/services/authService.ts', 'utf8');

code = code.replace(
  /async ensureUserProfileFields\(uid: string, data: any, email: string\): Promise<any> \{/,
  `async ensureUserProfileFields(uid: string, data: any, email: string, persist: boolean = true): Promise<any> {`
);

code = code.replace(
  /if \(changed\) \{[\s\S]*?const userDocRef = doc\(db, 'users', uid\);[\s\S]*?await setDoc\(userDocRef, updates, \{ merge: true \}\);[\s\S]*?return \{ \.\.\.data, \.\.\.updates, \.\.\.requiredFields \};[\s\S]*?\}/,
  `if (changed) {
      if (persist) {
        try {
          const userDocRef = doc(db, 'users', uid);
          await setDoc(userDocRef, updates, { merge: true });
        } catch(e) {
          console.warn("Failed to persist user profile fields", e);
        }
      }
      return { ...data, ...updates, ...requiredFields };
    }`
);

fs.writeFileSync('src/services/authService.ts', code);
