const fs = require('fs');
let code = fs.readFileSync('src/components/PartnerPortal.tsx', 'utf8');

// Define targetPartnerId at the top of the component
code = code.replace(
  /export default function PartnerPortal\(\{ userProfile, overridePartnerId, isAdminView, onBack \}: PartnerPortalProps\) \{\n  \/\/ General State\n  const \[partner, setPartner\] = useState<any>\(null\);/,
  `export default function PartnerPortal({ userProfile, overridePartnerId, isAdminView, onBack }: PartnerPortalProps) {
  const targetPartnerId = overridePartnerId || userProfile?.id;
  // General State
  const [partner, setPartner] = useState<any>(null);`
);

// We had replaced it in one spot with targetPartnerId (in useEffect), but wait, now it's defined at the top. Let's make sure it's clean.
code = code.replace(/const targetPartnerId = overridePartnerId \|\| userProfile\?\.id;\n    if \(\!targetPartnerId\) return;/, 'if (!targetPartnerId) return;');
code = code.replace(/const targetPartnerId = overridePartnerId \|\| userProfile\.id;\n    const partnerDocRef = doc\(db, 'partners', targetPartnerId\);/, "const partnerDocRef = doc(db, 'partners', targetPartnerId);");

// Replace all remaining userProfile.id with targetPartnerId, except in props interface and definition
code = code.replace(/userProfile\.id/g, 'targetPartnerId');

fs.writeFileSync('src/components/PartnerPortal.tsx', code);
