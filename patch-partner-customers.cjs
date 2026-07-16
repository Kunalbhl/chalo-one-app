const fs = require('fs');
let code = fs.readFileSync('src/components/PartnerPortal.tsx', 'utf8');

const customersTabContent = `
      {/* CUSTOMERS TAB */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
            <h3 className="text-sm font-black uppercase text-amber-400 mb-2">Customer Base</h3>
            <p className="text-[10px] text-slate-400 font-mono">View your repeat customers and top spenders</p>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-3xl">
              <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-white font-bold">No Customers Yet</p>
              <p className="text-xs text-slate-500 mt-1">Customers will appear here once you receive orders.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(
                orders.reduce((acc, order) => {
                  if (order.status !== 'Completed') return acc;
                  const cid = order.userId;
                  if (!acc[cid]) {
                    acc[cid] = {
                      id: cid,
                      name: order.customerName || 'Anonymous',
                      phone: order.customerPhone || 'N/A',
                      totalOrders: 0,
                      totalSpent: 0,
                      lastOrder: order.createdAt
                    };
                  }
                  acc[cid].totalOrders += 1;
                  acc[cid].totalSpent += (order.totalAmount || 0);
                  if (new Date(order.createdAt) > new Date(acc[cid].lastOrder)) {
                    acc[cid].lastOrder = order.createdAt;
                  }
                  return acc;
                }, {} as Record<string, any>)
              ).sort((a: any, b: any) => b.totalSpent - a.totalSpent).map((cust: any) => (
                <div key={cust.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-white font-bold">{cust.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">{cust.phone}</p>
                    </div>
                    {cust.totalOrders > 3 && (
                      <span className="px-2 py-1 bg-amber-400/20 text-amber-400 text-[9px] font-black uppercase rounded-lg">Loyal</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-850 pt-3">
                    <div>
                      <p className="text-slate-500 font-mono uppercase text-[9px]">Total Spent</p>
                      <p className="text-white font-bold">₹{cust.totalSpent.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-mono uppercase text-[9px]">Total Orders</p>
                      <p className="text-white font-bold">{cust.totalOrders}</p>
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] text-slate-400 font-mono">
                    Last active: {new Date(cust.lastOrder).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
`;

code = code.replace(/{activeTab === 'finance' && \(/, customersTabContent + "\n      {activeTab === 'finance' && (");
fs.writeFileSync('src/components/PartnerPortal.tsx', code);
