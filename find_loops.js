const fs = require('fs');

function findLoops(file) {
  const content = fs.readFileSync(file, 'utf8');
  // Look for any useEffect that sets state or writes to DB
}
