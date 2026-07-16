const fs = require('fs');
let code = fs.readFileSync('src/components/PartnerPortal.tsx', 'utf8');

code = code.replace(/analyticsData\.totalRevenue/g, 'analyticsData.totalRev');
code = code.replace(/analyticsData\.ordersCount/g, 'orders.length');

fs.writeFileSync('src/components/PartnerPortal.tsx', code);
