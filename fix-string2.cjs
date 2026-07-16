const fs = require('fs');
let code = fs.readFileSync('src/components/AdminControlCenter.tsx', 'utf8');

const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('alert("UTM Campaign URL generated and copied:')) {
    // This line is broken, and continues on next lines
    let j = i + 1;
    while (j < lines.length && !lines[j].includes('" + url);')) {
      j++;
    }
    if (j < lines.length) {
      lines[i] = '                    alert("UTM Campaign URL generated and copied: \\n" + url);';
      for (let k = i + 1; k <= j; k++) {
        lines[k] = '';
      }
    }
  }
}
fs.writeFileSync('src/components/AdminControlCenter.tsx', lines.join('\n'));
