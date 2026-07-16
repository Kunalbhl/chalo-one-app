const fs = require('fs');
let code = fs.readFileSync('src/components/PartnerPortal.tsx', 'utf8');

code = code.replace(/userProfile\.id/g, 'targetPartnerId');
// Oh wait, targetPartnerId is only defined in the useEffect!
// I need to define it at the top of the component.
