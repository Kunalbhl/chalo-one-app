const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const validatedData = await AuthService\.ensureUserProfileFields\(user\.uid, cloudData, user\.email \|\| ''\);/,
  `const validatedData = await AuthService.ensureUserProfileFields(user.uid, cloudData, user.email || '', false);`
);

fs.writeFileSync('src/App.tsx', code);
