const fs = require('fs');
let code = fs.readFileSync('src/services/authService.ts', 'utf-8');
code = code.replace(
`    if (!data.createdAt) {
      updates.createdAt = serverTimestamp();
      changed = true;
    }
    if (!data.lastLogin) {
      updates.lastLogin = serverTimestamp();
      changed = true;
    }
    if (!data.updatedAt) {
      updates.updatedAt = serverTimestamp();
      changed = true;
    }`,
`    if (data.createdAt === undefined) {
      updates.createdAt = serverTimestamp();
      changed = true;
    }
    if (data.lastLogin === undefined) {
      updates.lastLogin = serverTimestamp();
      changed = true;
    }
    if (data.updatedAt === undefined) {
      updates.updatedAt = serverTimestamp();
      changed = true;
    }`
);
fs.writeFileSync('src/services/authService.ts', code);
console.log("Replaced authService");
