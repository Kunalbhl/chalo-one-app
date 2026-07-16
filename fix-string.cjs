const fs = require('fs');
let code = fs.readFileSync('src/components/AdminControlCenter.tsx', 'utf8');

// The issue is a literal newline inside a double quote string
code = code.replace(/alert\("UTM Campaign URL generated and copied:\n" \+ url\);/g, 'alert("UTM Campaign URL generated and copied:\\n" + url);');

// Wait, let's just replace all literal newlines inside alert calls
code = code.replace(/alert\("([^"]*)\n([^"]*)"\)/g, 'alert("$1\\\\n$2")');

fs.writeFileSync('src/components/AdminControlCenter.tsx', code);
