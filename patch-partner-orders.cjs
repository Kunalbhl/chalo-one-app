const fs = require('fs');
let code = fs.readFileSync('src/components/PartnerPortal.tsx', 'utf8');

code = code.replace(
  /<h4 className="text-xs font-black uppercase text-white font-display">Live Kitchen Display System \(KDS\)<\/h4>/,
  `<h4 className="text-xs font-black uppercase text-white font-display">Live Order Management</h4>`
);

code = code.replace(
  /<p className="text-\[9\.5px\] text-slate-400 mt-0\.5 font-mono">Advance order statuses, set cooking delays, and print thermal slips\.<\/p>/,
  `<p className="text-[9.5px] text-slate-400 mt-0.5 font-mono">Manage live orders, update statuses, and coordinate with delivery partners.</p>`
);

fs.writeFileSync('src/components/PartnerPortal.tsx', code);
