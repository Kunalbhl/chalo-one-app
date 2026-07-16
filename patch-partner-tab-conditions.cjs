const fs = require('fs');
let code = fs.readFileSync('src/components/PartnerPortal.tsx', 'utf8');

code = code.replace(/activeTab === 'kds'/g, "activeTab === 'orders'");
code = code.replace(/activeTab === 'settlements'/g, "activeTab === 'finance'");
code = code.replace(/activeTab === 'coupons'/g, "activeTab === 'growth'");

fs.writeFileSync('src/components/PartnerPortal.tsx', code);
