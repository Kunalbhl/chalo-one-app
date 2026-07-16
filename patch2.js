const fs = require('fs');

function addImport(file, importStr) {
  let content = fs.readFileSync(file, 'utf8');
  if(!content.includes(importStr)) {
    let lines = content.split('\n');
    let i = 0;
    while(lines[i].startsWith('import')) {
      i++;
    }
    lines.splice(i, 0, importStr);
    fs.writeFileSync(file, lines.join('\n'));
    console.log("Added import to " + file);
  }
}
addImport('src/components/ActivityCenter.tsx', "import { getAuth } from 'firebase/auth';");
addImport('src/components/ActivityCenter.tsx', "import { LiveOperationsService } from '../services/liveOperationsService';");
addImport('src/services/bookingService.ts', "import { CommerceDataInstance } from './data/CommerceDataMapper';");
addImport('src/components/RidesModule.tsx', "import { DriverService } from '../services/driverService';");
