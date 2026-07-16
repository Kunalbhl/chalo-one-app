const fs = require('fs');
let code = fs.readFileSync('src/components/AdminControlCenter.tsx', 'utf8');

code = code.replace(
  /import \{ AdminGrowthCenter \} from '\.\/AdminGrowthCenter';/,
  "import { AdminGrowthCenter } from './AdminGrowthCenter';\nimport PartnerPortal from './PartnerPortal';"
);

const startMarker = "{selectedAdminPartner && (";
const endMarker = "{/* TAB 5: AGENTS SUITE (Part 9) */}";

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newBlock = "{selectedAdminPartner && (\\n" +
  "              <div className=\\\"absolute inset-0 z-50 bg-slate-950 overflow-y-auto\\\">\\n" +
  "                <PartnerPortal userProfile={userProfile} overridePartnerId={selectedAdminPartner.id} isAdminView={true} onBack={() => setSelectedAdminPartner(null)} />\\n" +
  "              </div>\\n" +
  "            )}\\n" +
  "          </div>\\n" +
  "        )}\\n\\n        ";
  code = code.substring(0, startIndex) + newBlock + code.substring(endIndex);
  fs.writeFileSync('src/components/AdminControlCenter.tsx', code);
} else {
  console.log("Could not find markers");
}
