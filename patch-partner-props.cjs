const fs = require('fs');
let code = fs.readFileSync('src/components/PartnerPortal.tsx', 'utf8');

code = code.replace(
  /interface PartnerPortalProps \{\n  userProfile: UserProfile;\n  onBack: \(\) => void;\n\}/,
  `interface PartnerPortalProps {
  userProfile: UserProfile;
  overridePartnerId?: string;
  isAdminView?: boolean;
  onBack: () => void;
}`
);

code = code.replace(
  /export default function PartnerPortal\(\{ userProfile, onBack \}: PartnerPortalProps\) \{/,
  `export default function PartnerPortal({ userProfile, overridePartnerId, isAdminView, onBack }: PartnerPortalProps) {`
);

code = code.replace(
  /const partnerDocRef = doc\(db, 'partners', userProfile\.id\);/,
  `const targetPartnerId = overridePartnerId || userProfile.id;
    const partnerDocRef = doc(db, 'partners', targetPartnerId);`
);

code = code.replace(
  /if \(!userProfile\?\.id\) return;/,
  `const targetPartnerId = overridePartnerId || userProfile?.id;
    if (!targetPartnerId) return;`
);

fs.writeFileSync('src/components/PartnerPortal.tsx', code);
