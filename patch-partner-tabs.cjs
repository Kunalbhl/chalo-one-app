const fs = require('fs');
let code = fs.readFileSync('src/components/PartnerPortal.tsx', 'utf8');

const oldTabs = `      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-850 overflow-x-auto">
        {[
          { id: 'overview', label: '🏠 Overview' },
          { id: 'kds', label: \`🍳 KDS / Orders (\${orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length})\` },
          { id: 'catalog', label: '🍔 Menu' },
          { id: 'inventory', label: '📦 Inventory' },
          { id: 'coupons', label: '🎟️ Coupons' },
          { id: 'staff', label: '👥 Staff' },
          { id: 'reviews', label: '⭐ Reviews' },
          { id: 'analytics', label: '📈 Analytics' },
          { id: 'settings', label: '⚙️ Settings' },
          { id: 'settlements', label: '💳 Settlements' },
          { id: 'support', label: '🛎️ Support' },
          { id: 'profile', label: '👤 Profile' }
        ].map(tab => (`;

const newTabs = `      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-850 overflow-x-auto">
        {[
          { id: 'overview', label: '🏠 Overview' },
          { id: 'orders', label: \`📦 Orders & Bookings (\${orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length})\` },
          { id: 'catalog', label: '🛒 Products & Menu' },
          { id: 'inventory', label: '📦 Inventory' },
          { id: 'branches', label: '🏢 Branches' },
          { id: 'staff', label: '👥 Employees' },
          { id: 'customers', label: '🤝 Customers' },
          { id: 'finance', label: '💳 Finance & Taxes' },
          { id: 'analytics', label: '📈 Analytics' },
          { id: 'growth', label: '🚀 Growth & Marketing' },
          { id: 'support', label: '🛎️ Support' },
          { id: 'profile', label: '👤 Business Profile' }
        ].map(tab => (`;

code = code.replace(oldTabs, newTabs);
fs.writeFileSync('src/components/PartnerPortal.tsx', code);
